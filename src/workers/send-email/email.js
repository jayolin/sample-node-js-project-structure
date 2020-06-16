require("templates/compiled/templates");
require("templates/helpers/index");
import mailgun from "mailgun-js";
import request from "request";
import {
  getFilenameWithExtensionFromURI,
  addProtocolToUrl
} from "workers/libs/utils";
import Handlebars from "handlebars/runtime";
// Handlebars.partials = Handlebars.templates;

class EmailWorker {
  static async sendMail(data) {
    return new Promise(async (resolve, reject) => {
      try {
        let {
          user,
          context,
          attachments = [],
          allowReplyTo = false,
          reply_to_email = data.user.email,
          template_name,
          cc_emails = null,
          bcc_emails = null,
          sendAttachment = true,
          subject
        } = data;
        const mailSender = mailgun({
          apiKey: process.env.MAILGUN_SECRET,
          domain: process.env.MAILGUN_DOMAIN
        });
        let _attachments = [];
        for (let i = 0; i < attachments.length; i++) {
          _attachments.push(
            new mailSender.Attachment({
              data: request(addProtocolToUrl(attachments[i])),
              filename: getFilenameWithExtensionFromURI(attachments[i])
            })
          );
        }
        // get html
        let template = Handlebars.templates[template_name];
        let html = template({
          context,
          user,
          baseUrl: process.env.FRONTEND_BASE_URL
        });
        let message = {
          from: `NCC Demo Portal <${process.env.MAIL_FROM}>`,
          to: user.email,
          subject,
          html
        };

        // add attachment if it is allowed and availables
        if (sendAttachment && _attachments.length > 0) {
          message = Object.assign({}, message, {
            attachment: _attachments
          });
        }

        // add replyTo if it is allowed
        if (allowReplyTo) {
          message = Object.assign({}, message, {
            "h:Reply-To": reply_to_email
          });
        }

        // add cc if it is allowed
        if (cc_emails) {
          message = Object.assign({}, message, {
            cc: cc_emails
          });
        }

        // add bcc if it is allowed
        if (bcc_emails) {
          message = Object.assign({}, message, {
            bcc: bcc_emails
          });
        }

        await mailSender.messages().send(message);
        resolve({ done: true });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default EmailWorker;
