import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { WEBHOOK_EVENTS } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED: {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        let userId = subscription.metadata?.userId;

        // If userId not in subscription metadata, get it from customer
        if (!userId) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            userId = (customer as any).metadata?.userId;
          } catch (customerError) {
            console.error("Error retrieving customer:", customerError);
          }
        }

        if (!userId) {
          console.error("No userId found in subscription or customer metadata");
          return NextResponse.json(
            { error: "No userId in metadata" },
            { status: 400 }
          );
        }

        console.log(`Processing subscription ${event.type} for user ${userId}`);

        // Upsert subscription
        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price?.id,
            plan_type: "monthly",
            status:
              subscription.status === "active" ? "active" : subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
          },
          {
            onConflict: "user_id",
          }
        );

        if (error) {
          console.error("Error upserting subscription:", error);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
          );
        }

        console.log(`Successfully processed subscription for user ${userId}`);
        break;
      }

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED: {
        const subscription = event.data.object as any;
        let userId = subscription.metadata?.userId;

        // If userId not in subscription metadata, get it from customer
        if (!userId) {
          try {
            const customer = await stripe.customers.retrieve(
              subscription.customer
            );
            userId = (customer as any).metadata?.userId;
          } catch (customerError) {
            console.error("Error retrieving customer:", customerError);
          }
        }

        if (!userId) {
          console.error("No userId found in subscription or customer metadata");
          return NextResponse.json(
            { error: "No userId in metadata" },
            { status: 400 }
          );
        }

        console.log(`Processing subscription deletion for user ${userId}`);

        // Update subscription status to canceled
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
          );
        }

        console.log(`Successfully canceled subscription for user ${userId}`);
        break;
      }

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED: {
        const invoice = event.data.object as any;
        console.log("Payment succeeded for invoice:", invoice.id);
        // Additional logic for successful payments can be added here
        break;
      }

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED: {
        const invoice = event.data.object as any;
        console.log("Payment failed for invoice:", invoice.id);

        // Update subscription status to past_due if payment fails
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating subscription to past_due:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
