export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export const emailTemplates = {
  welcome: (userName: string, isFirstUser: boolean): EmailTemplate => ({
    subject: `Welcome to Syndicate Vault${isFirstUser ? " - You're the Admin!" : ""}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Syndicate Vault</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 12px; padding: 40px; backdrop-filter: blur(10px); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo h1 { color: #f8fafc; font-size: 28px; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .content { color: #e2e8f0; line-height: 1.6; }
            .highlight { color: #60a5fa; font-weight: 600; }
            .admin-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin: 10px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(71, 85, 105, 0.3); color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <h1>🔐 Syndicate Vault</h1>
              </div>
              <div class="content">
                <h2 style="color: #f8fafc; margin-top: 0;">Welcome, ${userName}!</h2>
                ${
                  isFirstUser
                    ? `
                  <div class="admin-badge">👑 Admin Access Granted</div>
                  <p>Congratulations! You're the first user of this Syndicate Vault instance and have been automatically granted <span class="highlight">administrator privileges</span>.</p>
                  <p>As an admin, you can:</p>
                  <ul>
                    <li>Approve new user registrations</li>
                    <li>Generate invite codes for exclusive access</li>
                    <li>Manage user roles and permissions</li>
                    <li>Access the admin dashboard</li>
                  </ul>
                `
                    : `
                  <p>Your account has been created successfully! Your access is currently <span class="highlight">pending approval</span> from an administrator.</p>
                  <p>You'll receive another email once your account is approved and you can start using the vault.</p>
                `
                }
                <p>Syndicate Vault is your private, secure knowledge management system designed for exclusive access and collaboration.</p>
              </div>
              <div class="footer">
                <p>This is an automated message from Syndicate Vault. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Syndicate Vault, ${userName}!\n\n${isFirstUser ? "Congratulations! You're the first user and have been granted administrator privileges." : "Your account is pending approval from an administrator."}\n\nSyndicate Vault is your private, secure knowledge management system.\n\nThis is an automated message. Please do not reply.`,
  }),

  accountApproved: (userName: string): EmailTemplate => ({
    subject: "Your Syndicate Vault Access Has Been Approved! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Approved - Syndicate Vault</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 12px; padding: 40px; backdrop-filter: blur(10px); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo h1 { color: #f8fafc; font-size: 28px; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .content { color: #e2e8f0; line-height: 1.6; }
            .highlight { color: #60a5fa; font-weight: 600; }
            .success-badge { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin: 10px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(71, 85, 105, 0.3); color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <h1>🔐 Syndicate Vault</h1>
              </div>
              <div class="content">
                <div class="success-badge">✅ Account Approved</div>
                <h2 style="color: #f8fafc; margin-top: 0;">Great news, ${userName}!</h2>
                <p>Your Syndicate Vault account has been <span class="highlight">approved by an administrator</span>. You now have full access to the vault!</p>
                <p>You can now:</p>
                <ul>
                  <li>Save and organize your knowledge items</li>
                  <li>Use the browser bookmarklet for quick saves</li>
                  <li>Search through your collected content</li>
                  <li>Upload and manage files</li>
                  <li>Create and manage personal spaces</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/vault" class="cta-button">Access Your Vault</a>
              </div>
              <div class="footer">
                <p>Welcome to the exclusive Syndicate Vault community!</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Great news, ${userName}!\n\nYour Syndicate Vault account has been approved! You now have full access to save, organize, and manage your knowledge.\n\nAccess your vault at: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/vault\n\nWelcome to the exclusive Syndicate Vault community!`,
  }),

  magicLink: (userName: string, magicLinkUrl: string): EmailTemplate => ({
    subject: "Your Syndicate Vault Magic Link 🔗",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Magic Link - Syndicate Vault</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 12px; padding: 40px; backdrop-filter: blur(10px); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo h1 { color: #f8fafc; font-size: 28px; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .content { color: #e2e8f0; line-height: 1.6; text-align: center; }
            .magic-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 18px; margin: 30px 0; box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3); }
            .security-note { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(71, 85, 105, 0.3); color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <h1>🔐 Syndicate Vault</h1>
              </div>
              <div class="content">
                <h2 style="color: #f8fafc; margin-top: 0;">Your Magic Link is Ready!</h2>
                <p>Hello ${userName}, click the button below to securely access your Syndicate Vault:</p>
                <a href="${magicLinkUrl}" class="magic-button">🔗 Access Vault</a>
                <div class="security-note">
                  <strong>🔒 Security Notice:</strong> This link will expire in 1 hour and can only be used once. If you didn't request this link, please ignore this email.
                </div>
                <p style="font-size: 14px; color: #94a3b8;">If the button doesn't work, copy and paste this link into your browser:<br><br>${magicLinkUrl}</p>
              </div>
              <div class="footer">
                <p>This magic link was requested from your Syndicate Vault account.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your Syndicate Vault Magic Link\n\nHello ${userName},\n\nClick this link to securely access your vault:\n${magicLinkUrl}\n\nThis link expires in 1 hour and can only be used once.\n\nIf you didn't request this link, please ignore this email.`,
  }),
}
