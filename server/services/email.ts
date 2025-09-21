interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Get SendGrid API key from environment
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY not found, email functionality disabled");
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: params.to }],
          subject: params.subject,
        }],
        from: { email: params.from },
        content: [
          {
            type: 'text/plain',
            value: params.text || '',
          },
          ...(params.html ? [{
            type: 'text/html',
            value: params.html,
          }] : []),
        ],
      }),
    });

    if (!response.ok) {
      console.error('SendGrid API error:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export async function sendContactNotification(contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@estacioneai.com.br';
  const fromEmail = process.env.FROM_EMAIL || 'noreply@estacioneai.com.br';

  return sendEmail({
    to: adminEmail,
    from: fromEmail,
    subject: `[EstacioneAI] Nova mensagem de contato: ${contactData.subject}`,
    text: `
Nova mensagem de contato recebida:

Nome: ${contactData.name}
Email: ${contactData.email}
Assunto: ${contactData.subject}

Mensagem:
${contactData.message}
    `,
    html: `
<h2>Nova mensagem de contato recebida</h2>
<p><strong>Nome:</strong> ${contactData.name}</p>
<p><strong>Email:</strong> ${contactData.email}</p>
<p><strong>Assunto:</strong> ${contactData.subject}</p>
<br>
<p><strong>Mensagem:</strong></p>
<p>${contactData.message.replace(/\n/g, '<br>')}</p>
    `,
  });
}

export async function sendReservationConfirmation(reservationData: {
  email: string;
  spotNumber: string;
  startTime: Date;
  endTime: Date;
  cost: string;
}): Promise<boolean> {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@estacioneai.com.br';

  return sendEmail({
    to: reservationData.email,
    from: fromEmail,
    subject: `[EstacioneAI] Confirmação de Reserva - Vaga ${reservationData.spotNumber}`,
    text: `
Sua reserva foi confirmada!

Vaga: ${reservationData.spotNumber}
Período: ${reservationData.startTime.toLocaleString('pt-BR')} até ${reservationData.endTime.toLocaleString('pt-BR')}
Custo Total: R$ ${reservationData.cost}

Obrigado por usar o EstacioneAI!
    `,
    html: `
<h2>Reserva Confirmada!</h2>
<p>Sua reserva foi confirmada com sucesso.</p>
<br>
<p><strong>Vaga:</strong> ${reservationData.spotNumber}</p>
<p><strong>Período:</strong> ${reservationData.startTime.toLocaleString('pt-BR')} até ${reservationData.endTime.toLocaleString('pt-BR')}</p>
<p><strong>Custo Total:</strong> R$ ${reservationData.cost}</p>
<br>
<p>Obrigado por usar o EstacioneAI!</p>
    `,
  });
}
