import aiosmtplib
from email.message import EmailMessage

async def send_email(sender, password, recipient, subject, body, smtp_server, smtp_port):
    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    await aiosmtplib.send(
        message,
        hostname=smtp_server,
        port=smtp_port,
        username=sender,
        password=password,
        start_tls=True,
    ) 