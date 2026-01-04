import axios from "axios";

const smsResponseMessages: { [key: string]: string } = {
  TG00: "MESSAGE PROCESSED",
  TG11: "Invalid Authentication Credentials",
  TG14: "Empty Recipients",
  TG15: "Empty Message",
  TG17: "Not Enough Units Balance",
  TG20: "Recipients above the maximum target",
  "0000": "MESSAGE SENT TO PROVIDER",
  "1111": "MESSAGE DELIVERED TO HANDSET",
  "2222": "MESSAGE REJECTED",
  "0014": "MESSAGE SENT THROUGH COOPERATE",
  "3333": "DND_REJECTED_NUMBER",
};

export const sendSMS = async (recipient: string, message: string) => {
  const senderName = process.env.NEXT_PUBLIC_SMS_SENDER as string;
  const headers = {
    "X-Token": process.env.VT_TOKEN as string,
    "X-Secret": process.env.VT_SECRET as string,
  };

  try {
    const response = await axios.get(
      "https://messaging.vtpass.com/api/sms/sendsms",
      {
        params: {
          sender: senderName,
          recipient,
          message,
          responsetype: "json",
        },
        headers: {
          ...headers,
          "Cache-Control": "no-cache, no-store",
        },
      }
    );

    const responseCode = response.data?.responseCode;
    const responseMessage =
      smsResponseMessages[responseCode] || "Failed to send SMS";

    if (responseCode === "TG00") {
      const messageDetails = response.data.messages[0];
      const messageStatus = messageDetails.statusCode;

      if (messageStatus === "0000" || messageStatus === "1111") {
        return { success: true, message: messageDetails.description };
      } else {
        return { success: false, message: messageDetails.description };
      }
    } else {
      return { success: false, message: responseMessage };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Error sending SMS",
      };
    } else {
      return {
        success: false,
        message: "Unexpected error occurred while sending SMS",
      };
    }
  }
};
