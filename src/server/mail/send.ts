import nodemailer from "nodemailer";

export async function sendLedgerEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const url = process.env.SMTP_URL;
  if (!url) return false;
  try {
    const transport = nodemailer.createTransport(url);
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "Noirly Ledger <noreply@localhost>",
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return true;
  } catch (error) {
    console.error("ledger email failed", error);
    return false;
  }
}
