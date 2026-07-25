import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const templatesDir = path.join(__dirname, '..', 'templates');

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: Number(process.env.MAILER_PORT || 587),
  secure: false,
  auth: process.env.MAILER_USERNAME
    ? {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
      }
    : undefined,
});

function renderTemplate(templateName: string, context: Record<string, any>) {
  const filePath = path.join(templatesDir, `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = handlebars.compile(source);
  return compiled(context);
}

export async function sendInviteEmail(email: string) {
  if (!process.env.MAILER_HOST) {
    return;
  }

  const html = renderTemplate('invite', {});

  await transporter.sendMail({
    to: email,
    subject: 'User Invitation',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, link: string) {
  if (!process.env.MAILER_HOST) {
    return;
  }

  const html = renderTemplate('password_reset', { reset_link: link });

  await transporter.sendMail({
    to: email,
    subject: 'Password Reset',
    html,
  });
}

