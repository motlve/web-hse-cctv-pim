package utils

import (
	"fmt"
	"os"

	"gopkg.in/gomail.v2"
)

func SendOTPEmail(to string, otp string) error {

	m := gomail.NewMessage()

	m.SetHeader(
		"From",
		"CCTV HSE PIM <hsecctvpim@gmail.com>",
	)

	m.SetHeader(
		"To",
		to,
	)

	m.SetHeader(
		"Subject",
		"Kode OTP Reset Password - CCTV HSE PIM",
	)

	emailTemplate := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password</title>
</head>

<body style="
	margin:0;
	padding:0;
	background:#eef1f8;
	font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing:antialiased;
">

<table width="100%%" cellpadding="0" cellspacing="0" style="background:#eef1f8; padding:48px 16px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="
	width:600px;
	max-width:100%%;
	background:#ffffff;
	border-radius:20px;
	overflow:hidden;
	box-shadow:0 10px 35px rgba(30,41,59,0.12);
">

<!-- HEADER -->
<tr>
<td style="
	background:linear-gradient(135deg,#1d4ed8,#4338ca 60%%,#6d28d9);
	padding:36px 32px;
	text-align:center;
	color:#ffffff;
">
	<div style="
		display:inline-block;
		width:56px;
		height:56px;
		line-height:56px;
		border-radius:14px;
		background:rgba(255,255,255,0.15);
		font-size:26px;
		margin-bottom:14px;
	">🛡️</div>
	<h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:0.3px;">
		CCTV HSE PIM
	</h1>
	<p style="margin:6px 0 0; font-size:13px; color:#dbeafe; letter-spacing:0.4px; text-transform:uppercase;">
		Security Monitoring System
	</p>
</td>
</tr>

<!-- CONTENT -->
<tr>
<td style="padding:40px 36px 32px; color:#374151;">

	<h2 style="margin:0 0 12px; font-size:19px; color:#111827; font-weight:700;">
		Permintaan Reset Password
	</h2>

	<p style="margin:0 0 6px; font-size:14.5px; line-height:1.6; color:#4b5563;">
		Kami menerima permintaan reset password untuk akun CCTV HSE PIM Anda.
		Gunakan kode di bawah ini untuk melanjutkan proses:
	</p>

	<!-- OTP BOX -->
	<div style="
		margin:28px 0 20px;
		text-align:center;
		background:linear-gradient(135deg,#eff6ff,#eef2ff);
		border:1.5px solid #c7d7fe;
		padding:26px 20px;
		border-radius:16px;
	">
		<p style="margin:0 0 10px; font-size:11.5px; letter-spacing:1.5px; text-transform:uppercase; color:#6366f1; font-weight:700;">
			Kode OTP Anda
		</p>
		<span style="
			display:inline-block;
			font-family:'Courier New', monospace;
			font-size:36px;
			font-weight:700;
			letter-spacing:10px;
			color:#1d4ed8;
		">%s</span>
	</div>

	<p style="
		display:flex;
		align-items:center;
		gap:6px;
		font-size:13px;
		color:#6b7280;
		margin:0 0 24px;
		text-align:center;
		justify-content:center;
	">
		⏱️ Kode berlaku selama <b style="color:#374151;">&nbsp;5 menit&nbsp;</b>
	</p>

	<!-- WARNING -->
	<div style="
		background:#fff7ed;
		border-left:4px solid #f97316;
		padding:16px 18px;
		border-radius:10px;
	">
		<p style="margin:0; font-size:13.5px; line-height:1.6; color:#9a3412;">
			<b>⚠️ Peringatan Keamanan</b><br>
			Jangan berikan kode OTP ini kepada siapa pun. Tim CCTV HSE PIM tidak
			pernah meminta kode OTP Anda melalui telepon, email, atau media lain.
		</p>
	</div>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="
	background:#f9fafb;
	padding:22px 32px;
	text-align:center;
	border-top:1px solid #eef0f4;
">
	<p style="margin:0 0 4px; font-size:12px; color:#9ca3af;">
		© 2026 CCTV HSE PIM &middot; Security Monitoring System
	</p>
	<p style="margin:0; font-size:11.5px; color:#c1c5cc;">
		Email ini dikirim secara otomatis, mohon tidak membalas email ini.
	</p>
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`,
		otp,
	)

	m.SetBody(
		"text/html",
		emailTemplate,
	)

	// SECURITY NOTE: the SMTP password used to be hardcoded here in plain text.
	// It has been moved to an environment variable — set SMTP_PASSWORD before
	// running the app (e.g. in your .env / deployment secrets), and rotate the
	// old Gmail App Password since it was exposed in source.
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	d := gomail.NewDialer(
		"smtp.gmail.com",
		465,
		"hsecctvpim@gmail.com",
		smtpPassword,
	)

	d.SSL = true

	err := d.DialAndSend(m)
	if err != nil {
		fmt.Println("SMTP ERROR :", err)
		return err
	}

	fmt.Println("================================")
	fmt.Println("EMAIL BERHASIL DIKIRIM")
	fmt.Println("TUJUAN :", to)
	fmt.Println("OTP    :", otp)
	fmt.Println("================================")

	return nil
}