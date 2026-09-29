import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }

  return digits;
}

function internalAuthEmail(partnerId: string) {
  return `delivery.${partnerId}@nexora.local`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const email = String(body.email ?? "").trim();
    const area = String(body.area ?? "").trim();
    const vehicleType = String(body.vehicleType ?? "").trim();
    const vehicleNumber = String(body.vehicleNumber ?? "").trim();

    if (!name || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, phone number, password and confirm password are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit phone number.",
        },
        { status: 400 },
      );
    }

    // Delivery partner names are used for login, so keep them unique.
    const { data: existingPartners, error: partnerLookupError } =
      await supabase
        .from("delivery_partners")
        .select("id, name, phone");

    if (partnerLookupError) {
      console.error(
        "Delivery partner lookup error:",
        partnerLookupError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to check existing delivery partner accounts.",
        },
        { status: 500 },
      );
    }

    const duplicateName = (existingPartners ?? []).find(
      (partner: any) =>
        normalizeName(String(partner.name ?? "")) ===
        normalizeName(name),
    );

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A delivery partner account already exists with this name. Please use a different name.",
        },
        { status: 409 },
      );
    }

    const duplicatePhone = (existingPartners ?? []).find(
      (partner: any) =>
        normalizePhone(String(partner.phone ?? "")) === normalizedPhone,
    );

    if (duplicatePhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A delivery partner account already exists with this phone number.",
        },
        { status: 409 },
      );
    }

    // Create the Auth account with an internal email.
    // The delivery partner never needs to enter or see this email.
    const temporaryPartnerId = crypto.randomUUID();
    const authEmail = internalAuthEmail(temporaryPartnerId);

    const { data: createdUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "delivery_partner",
          name,
        },
      });

    if (authError || !createdUser.user) {
      console.error(
        "Delivery Auth account creation error:",
        authError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            authError?.message ||
            "Unable to create the delivery partner login account.",
        },
        { status: 400 },
      );
    }

    const authUserId = createdUser.user.id;

    // delivery_partners.id must reference auth.users.id.
    // Use the Auth user's actual UUID.
    const { data: partner, error: partnerError } =
      await supabase
        .from("delivery_partners")
        .insert({
          id: authUserId,
          name,
          email: email || null,
          phone: normalizedPhone,
          status: "available",
          area: area || "",
          vehicle_type: vehicleType || null,
          vehicle_number: vehicleNumber || null,
          kyc_status: "pending",
        })
        .select(
          `
            id,
            name,
            email,
            phone,
            status,
            area,
            vehicle_type,
            vehicle_number,
            kyc_status
          `,
        )
        .single();

    if (partnerError || !partner) {
      console.error(
        "Delivery partner creation error:",
        partnerError,
      );

      // Remove the Auth account if the partner row could not be created.
      await supabase.auth.admin.deleteUser(authUserId);

      return NextResponse.json(
        {
          success: false,
          message:
            partnerError?.message ||
            "Unable to create the delivery partner record.",
        },
        { status: 400 },
      );
    }

    // Replace the temporary internal email with one based on the
    // actual Auth UUID. This keeps the login mapping deterministic.
    const finalAuthEmail = internalAuthEmail(authUserId);

    const { data: updatedUser, error: emailUpdateError } =
      await supabase.auth.admin.updateUserById(authUserId, {
        email: finalAuthEmail,
        email_confirm: true,
        user_metadata: {
          role: "delivery_partner",
          delivery_partner_id: partner.id,
          name: partner.name,
        },
      });

    if (emailUpdateError || !updatedUser.user) {
      console.error(
        "Delivery Auth email update error:",
        emailUpdateError,
      );

      await supabase.from("delivery_partners").delete().eq("id", authUserId);
      await supabase.auth.admin.deleteUser(authUserId);

      return NextResponse.json(
        {
          success: false,
          message:
            emailUpdateError?.message ||
            "Unable to finish creating the delivery partner login account.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Delivery partner account created successfully. You can now sign in with your name and password.",
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
    console.error("Delivery partner signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating the delivery partner account.",
      },
      { status: 500 },
    );
  }
}
