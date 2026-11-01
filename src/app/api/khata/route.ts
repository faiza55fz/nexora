
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type KhataTransaction = {
  id: string;
  order_id: string | null;
  entry_type: "credit" | "payment";
  amount: number | string;
  description: string | null;
  payment_method: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const { data: transactions, error } = await supabaseAdmin
      .from("khata_transactions")
      .select(
        "id, order_id, entry_type, amount, description, payment_method, created_at"
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const typedTransactions: KhataTransaction[] =
      (transactions ?? []) as KhataTransaction[];

    const balance = typedTransactions.reduce(
      (total: number, transaction: KhataTransaction) => {
        const amount = Number(transaction.amount);

        return total +
          (transaction.entry_type === "credit" ? amount : -amount);
      },
      0
    );

    return NextResponse.json({
      balance,
      transactions: typedTransactions,
    });
  } catch (error) {
    console.error("Khata API error:", error);

    return NextResponse.json(
      { error: "Unable to load Khata details" },
      { status: 500 }
    );
  }
}
