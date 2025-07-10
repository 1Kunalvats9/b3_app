import pkg from 'twilio';
const { Twilio } = pkg; 
import asyncHandler from 'express-async-handler';
import dotenv from 'dotenv';

dotenv.config();

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMSProgrammatic = async (phoneNumber, message) => {
    try {
        if (!phoneNumber || !message) {
            throw new Error('Phone number and message are required.');
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new Error('Invalid phone number format. Must be 10 digits.');
        }

        const twilioMessage = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${phoneNumber}`,
        });

        console.log(`SMS sent to ${phoneNumber}. SID: ${twilioMessage.sid}`);
        return { success: true, sid: twilioMessage.sid };
    } catch (err) {
        console.error(`❌ SMS Error for ${phoneNumber}:`, err.message);
        return { success: false, error: err.message || 'An unknown error occurred during SMS send.' };
    }
};

export const sendSMSRoute = asyncHandler(async (req, res) => {
    try {
      const { phoneNumber, mssg } = req.body;

      if (!phoneNumber || !mssg) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number and message are required' 
        });
      }

      const result = await sendSMSProgrammatic(phoneNumber, mssg);

      if (result.success) {
        return res.status(200).json({ success: true, sid: result.sid });
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      console.error('❌ SMS Route Error:', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message || 'An unknown error occurred' 
      });
    }
});
