import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function internalAuthEmail(partnerId: string) {
  return `delivery.${partnerId}@nexora.local`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");

    if (!name || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery partner name and password are required.",
        },
        { status: 400 },
      );
    }

    const { data: partners, error: partnerError } =
      await supabaseAdmin
        .from("delivery_partners")
        .select(`
          id,
          name,
          email,
          phone,
          status,
          area,
          vehicle_type,
          vehicle_number,
          kyc_status
        `);

    if (partnerError) {
      console.error("Delivery partner lookup error:", partnerError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify the delivery partner.",
        },
        { status: 500 },
      );
    }

    const normalizedName = normalizeName(name);

    const partner = (partners ?? []).find(
      (item: any) =>
        normalizeName(String(item.name ?? "")) === normalizedName,
    );

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No delivery partner account is registered with this name.",
        },
        { status: 404 },
      );
    }

    const authEmail = internalAuthEmail(partner.id);

    // Find the matching Auth user.
    const { data: authUsers, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      console.error("Delivery Auth user lookup error:", usersError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to check the login account.",
        },
        { status: 500 },
      );
    }

    let authUser = (authUsers.users ?? []).find(
      (user) => user.email?.toLowerCase() === authEmail.toLowerCase(),
    );

    // Existing delivery partners created with the old phone-login system
    // may not have an email. Their Auth ID is the same as delivery_partners.id.
    if (!authUser) {
      authUser = (authUsers.users ?? []).find(
        (user) => user.id === partner.id,
      );
    }

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The delivery partner login account could not be found.",
        },
        { status: 404 },
      );
    }

    // Give old phone-auth users the internal email required by the
    // new name + password login flow.
    if (authUser.email?.toLowerCase() !== authEmail.toLowerCase()) {
      const { data: updatedUser, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          email: authEmail,
          email_confirm: true,
          user_metadata: {
            ...(authUser.user_metadata ?? {}),
            role: "delivery_partner",
            delivery_partner_id: partner.id,
            name: partner.name,
          },
        });

      if (updateError || !updatedUser.user) {
        console.error(
          "Delivery Auth email setup error:",
          updateError,
        );

        return NextResponse.json(
          {
            success: false,
            message:
              updateError?.message ||
              "Unable to prepare the delivery partner login account.",
          },
          { status: 500 },
        );
      }

      authUser = updatedUser.user;
    }

    const { data: authData, error: authError } =
      await supabaseAuth.auth.signInWithPassword({
        email: authEmail,
        password,
      });

    if (authError || !authData.session || !authData.user) {
      console.error("Delivery partner login error:", authError);

      return NextResponse.json(
        {
          success: false,
          message: "Incorrect delivery partner name or password.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      session: authData.session,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        status: partner.status,
        area: partner.area,
        vehicleType: partner.vehicle_type,
        vehicleNumber: partner.vehicle_number,
        kycStatus: partner.kyc_status,
      },
    });
  } catch (error) {
    console.error("Delivery partner login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while signing in.",
      },
      { status: 500 },
    );
  }
}
