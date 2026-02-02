import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      invoice_id, 
      total_amount_cents, 
      installment_count = 3,
      frequency = 'monthly'
    } = await req.json();

    const installmentAmount = Math.round(total_amount_cents / installment_count);
    const startDate = new Date();

    // Generate installment schedule
    const installments = [];
    for (let i = 0; i < installment_count; i++) {
      const dueDate = new Date(startDate);
      if (frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + i + 1);
      else if (frequency === 'weekly') dueDate.setDate(dueDate.getDate() + (i + 1) * 7);

      installments.push({
        installment_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount_cents: i === installment_count - 1 
          ? total_amount_cents - (installmentAmount * (installment_count - 1))
          : installmentAmount,
        status: 'pending'
      });
    }

    const plan = await base44.entities.PaymentPlan.create({
      user_email: user.email,
      invoice_id,
      total_amount_cents,
      installment_count,
      installment_amount_cents: installmentAmount,
      frequency,
      start_date: startDate.toISOString().split('T')[0],
      installments,
      status: 'active'
    });

    return Response.json({
      success: true,
      plan_id: plan.id,
      installments: installments.length,
      installment_amount: installmentAmount / 100
    });
  } catch (error) {
    console.error('Error creating payment plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});