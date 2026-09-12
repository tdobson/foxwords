# AWS SES Least-Privilege IAM Setup Runbook for Foxwords

This runbook documents the exact least-privilege setup for Foxwords magic-link email delivery via Amazon Simple Email Service (SES) in region `eu-west-2` (London).

---

## CRITICAL SAFETY WARNINGS

1. **NEVER USE `--profile xebit`**: The `xebit` AWS profile belongs to client infrastructure and must NEVER be touched, queried, or modified under any circumstance. Always explicitly provide `--profile default` on every AWS CLI command.
2. **DO NOT COMMIT SECRETS**: Never commit AWS Access Key IDs or Secret Access Keys to Git or print them in terminal logs.
3. **TRANSIENT KEY STORAGE**: Create credentials only when required with `umask 077`, store them directly into Cloudflare Worker secrets via `wrangler secret put`, and delete any local temporary credential file immediately.

---

## 1. Verify Caller Identity & SES Environment

Run the following checks using only the `default` AWS profile:

```bash
# Verify calling identity (expected: tim / webstorm identity)
aws sts get-caller-identity --profile default

# Verify SES v2 account status in eu-west-2 (check production vs sandbox status)
aws sesv2 get-account --region eu-west-2 --profile default

# List verified sender domains and email addresses
aws sesv2 list-email-identities --region eu-west-2 --profile default
```

Take note of the verified identity ARN (e.g. `arn:aws:ses:eu-west-2:ACCOUNT_ID:identity/foxwords.net` or `arn:aws:ses:eu-west-2:ACCOUNT_ID:identity/hello@tdobson.net`).

---

## 2. Least-Privilege IAM Policy

The policy strictly permits sending email through the SES Query API or SendRawEmail, scoped ONLY to the verified sender identity:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FoxwordsSendMagicLinksOnly",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "arn:aws:ses:eu-west-2:<ACCOUNT_ID>:identity/<VERIFIED_SENDER_OR_DOMAIN>"
    }
  ]
}
```

This user cannot:
- Read incoming emails
- Create or modify SES identities or DKIM settings
- Send emails with an unverified `From:` header
- Access S3, DynamoDB, EC2, or any other AWS service.

---

## 3. IAM User and Key Provisioning

```bash
# 1. Create the dedicated service user
aws iam create-user --user-name foxwords-ses-mailer --profile default

# 2. Attach the inline least-privilege policy
aws iam put-user-policy \
  --user-name foxwords-ses-mailer \
  --policy-name FoxwordsSendMagicLinks \
  --policy-document file://ses-send-policy.json \
  --profile default

# 3. Create access key with strict filesystem permissions outside repository
(umask 077 && aws iam create-access-key --user-name foxwords-ses-mailer --profile default > /tmp/ses-keys.json)

# 4. Configure Cloudflare Worker secrets (for dev and production)
# Dev environment:
wrangler secret put AWS_ACCESS_KEY_ID --env dev
wrangler secret put AWS_SECRET_ACCESS_KEY --env dev
wrangler secret put SES_SENDER_EMAIL --env dev

# Production environment:
wrangler secret put AWS_ACCESS_KEY_ID --env production
wrangler secret put AWS_SECRET_ACCESS_KEY --env production
wrangler secret put SES_SENDER_EMAIL --env production

# 5. IMMEDIATELY shred and remove temporary key file
shred -u /tmp/ses-keys.json || rm -f /tmp/ses-keys.json
```

---

## 4. Operational Notes

- **Sandbox vs Production**: If SES is still in sandbox mode in `eu-west-2`, recipient email addresses must first be verified in SES before sending test emails. Request production access in the AWS SES Console when ready for public signups.
- **Local Development**: `APP_ENV=local` uses an in-memory mail sink (`defaultLocalMailSink`) and logs to the console. It will never invoke AWS SES or require credentials.
