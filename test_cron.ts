import { prisma } from "./src/lib/client";
import { getTransporter } from "./src/lib/email";

async function main() {
    console.log("Starting cron test...");
    const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - 7); // commented out just like the route

    console.log("Querying old events...");
    const oldEvents = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${oldEvents.length} events.`);

    if (oldEvents.length === 0) {
      console.log("No events to process.");
      return;
    }

    const jsonlContent = oldEvents.map(e => JSON.stringify(e)).join("\n");
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'jespejo@jdevoto.cl';
    const dateStr = new Date().toISOString().split('T')[0];

    console.log(`Sending email to ${adminEmail}...`);
    try {
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: `"Sistema JDevoto Test" <${process.env.SMTP_USER || 'test@test.com'}>`,
            to: adminEmail,
            subject: `📊 Test Backup Analíticas - ${dateStr}`,
            text: `Prueba de envío de analíticas. Eventos: ${oldEvents.length}`,
            attachments: [
                {
                    filename: `analytics-backup-${dateStr}.jsonl`,
                    content: jsonlContent
                }
            ]
        });
        console.log("Email sent successfully!");
    } catch (e) {
        console.error("Error sending email:", e);
    }
}

main().catch(console.error).finally(() => process.exit(0));
