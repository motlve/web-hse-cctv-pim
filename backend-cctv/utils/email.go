package utils

import (
	"fmt"

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

<html>

<head>

<meta charset="UTF-8">

<title>Reset Password</title>

</head>


<body

style="
margin:0;
padding:0;
background:#f3f6fb;
font-family:Arial,Helvetica,sans-serif;
">


<table

width="100%%"

cellpadding="0"

cellspacing="0"

style="
background:#f3f6fb;
padding:40px 0;
">


<tr>

<td align="center">


<table

width="600"

cellpadding="0"

cellspacing="0"

style="
background:#ffffff;
border-radius:16px;
overflow:hidden;
box-shadow:0 5px 20px rgba(0,0,0,0.08);
">


<!-- HEADER -->

<tr>

<td

style="
background:linear-gradient(135deg,#2563eb,#4f46e5);
padding:30px;
text-align:center;
color:white;
">


<h2

style="
margin:0;
font-size:26px;
">

CCTV HSE PIM

</h2>


<p

style="
margin-top:8px;
font-size:14px;
opacity:0.9;
">

Security Monitoring System

</p>


</td>

</tr>



<!-- CONTENT -->

<tr>

<td

style="
padding:35px;
color:#374151;
">


<h3

style="
font-size:20px;
color:#111827;
">

Reset Password Request

</h3>



<p>

Kami menerima permintaan untuk melakukan reset password akun CCTV HSE PIM Anda.

</p>



<p>

Gunakan kode OTP berikut untuk melanjutkan proses reset password:

</p>



<!-- OTP BOX -->

<div

style="
margin:30px 0;
text-align:center;
background:#eff6ff;
border:2px dashed #2563eb;
padding:20px;
border-radius:12px;
">


<span

style="
font-size:38px;
font-weight:bold;
letter-spacing:8px;
color:#2563eb;
">

%s

</span>


</div>




<p

style="
font-size:14px;
color:#6b7280;
">

Kode OTP ini hanya berlaku selama

<b>5 menit</b>.

</p>



<div

style="
background:#fff7ed;
border-left:5px solid #f97316;
padding:15px;
border-radius:8px;
margin-top:25px;
">


<p

style="
margin:0;
font-size:14px;
color:#9a3412;
">

<b>Peringatan Keamanan:</b>

<br>

Jangan berikan kode OTP ini kepada siapapun.

Tim CCTV HSE PIM tidak pernah meminta kode OTP Anda.

</p>


</div>



</td>

</tr>



<!-- FOOTER -->

<tr>

<td

style="
background:#f9fafb;
padding:20px;
text-align:center;
font-size:12px;
color:#6b7280;
">


<p>

© 2026 CCTV HSE PIM

</p>


<p>

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



d := gomail.NewDialer(
	"smtp.gmail.com",
	587,
	"hsecctvpim@gmail.com",
	"nwzozyoqiwconwwh",
)

d.SSL = false



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