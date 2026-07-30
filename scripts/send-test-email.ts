/**
 * CLI test-send script for the psalter email client (Phase 07, EMAIL-01).
 *
 * Usage:
 *   npx tsx scripts/send-test-email.ts <recipient@example.com> [--dry-run] [--label "gmail"]
 *
 * Loads the project .env first (owns DATABASE_URL etc.), then the shared VPS secrets file
 * (owns PSALTER_RESEND_API_KEY / PSALTER_RESEND_FROM_ADDRESS). dotenv never overwrites an
 * already-set variable, so load order = precedence order.
 */
import { config } from 'dotenv'

config()
config({ path: '/home/services/.env.production' })

import { sendEmail, getFromAddress, isEmailConfigured } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function printUsage() {
  console.error(
    'Usage: npx tsx scripts/send-test-email.ts <recipient@example.com> [--dry-run] [--label "gmail"]'
  )
}

async function main() {
  const args = process.argv.slice(2)

  let recipient: string | undefined
  let dryRun = false
  let label: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--label') {
      label = args[i + 1]
      i++
    } else if (!arg.startsWith('--') && !recipient) {
      recipient = arg
    }
  }

  if (!recipient) {
    printUsage()
    process.exit(2)
  }

  if (!EMAIL_RE.test(recipient)) {
    printUsage()
    process.exit(2)
  }

  const timestamp = new Date().toISOString()
  const from = getFromAddress()
  const configured = isEmailConfigured()
  const subject = `CPRC Psalter — email delivery test ${timestamp}${label ? ` (${label})` : ''}`

  const textBody = [
    'This is a delivery test message from the CPRC Psalter email system.',
    `From address: ${from}`,
    'Sending subdomain: mail.gsdlabs.dev',
    `Sent at: ${timestamp}`,
    'To confirm authentication passed, open "Show original" (Gmail) or "View message source"',
    '(Outlook) and check for spf=pass, dkim=pass, dmarc=pass.',
    '',
    'https://psalter.gsdlabs.dev',
  ].join('\n')

  const htmlBody = [
    '<p>This is a delivery test message from the CPRC Psalter email system.</p>',
    `<p>From address: ${from}</p>`,
    '<p>Sending subdomain: mail.gsdlabs.dev</p>',
    `<p>Sent at: ${timestamp}</p>`,
    '<p>To confirm authentication passed, open "Show original" (Gmail) or "View message source" (Outlook) ' +
      'and check for spf=pass, dkim=pass, dmarc=pass.</p>',
    '<p><a href="https://psalter.gsdlabs.dev">https://psalter.gsdlabs.dev</a></p>',
  ].join('\n')

  console.log(`from=${from}`)
  console.log(`to=${recipient}`)
  console.log(`subject=${subject}`)
  console.log(`configured=${configured}`)

  if (dryRun) {
    process.exit(0)
  }

  const result = await sendEmail({
    to: recipient,
    subject,
    html: htmlBody,
    text: textBody,
  })

  if (result.ok) {
    console.log(`sent id=${result.id}`)
    process.exit(0)
  } else {
    console.error(`FAILED ${result.error}`)
    process.exit(1)
  }
}

main()
