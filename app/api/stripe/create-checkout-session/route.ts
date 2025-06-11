import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { STRIPE_CONFIG } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    if (!STRIPE_CONFIG.PRICE_ID) {
      console.error("STRIPE_CONFIG.PRICE_ID is not configured");
      return NextResponse.json(
        { error: "Price configuration missing" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      return NextResponse.json(
        { error: "Admins do not need to pay" },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSubscription && existingSubscription.plan_type === "monthly") {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 }
      );
    }

    // Get user email
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = existingSubscription?.stripe_customer_id;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: userProfile.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
      } catch (stripeError) {
        console.error("Stripe customer creation error:", stripeError);
        return NextResponse.json(
          { error: "Failed to create customer" },
          { status: 500 }
        );
      }
    }

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: STRIPE_CONFIG.PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${request.nextUrl.origin}/dashboard?payment=success`,
        cancel_url: `${request.nextUrl.origin}/product?payment=cancelled`,
        metadata: {
          userId: user.id,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeError) {
      console.error("Stripe checkout session creation error:", stripeError);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
