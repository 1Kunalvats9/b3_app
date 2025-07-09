// src/utils/upiPayment.js
import { Linking, Alert } from 'react-native'; 

const initiateUpiPayment = async (amount) => {
  const vpa = '7878117101@ptyes'; 

  const payeeName = 'B3 Store'; 
  const transactionRef = `B3STORE_TXN_${Date.now()}`; 
  const transactionNote = `Payment for Shopping Items`;
  const amountString = amount.toFixed(2);
  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(payeeName)}&mc=0000&tid=${transactionRef}&tr=${transactionRef}&tn=${encodeURIComponent(transactionNote)}&am=${amountString}&cu=INR`;

  try {
    const supported = await Linking.canOpenURL(upiUrl);

    if (!supported) {
      Alert.alert(
        'UPI App Not Found',
        'No UPI payment application found on your device. Please install one (like Google Pay, PhonePe, Paytm) to proceed with online payment.'
      );
      return false; 
    }
    await Linking.openURL(upiUrl);
    Alert.alert(
      'Payment Initiated',
      'Please complete the payment in your UPI app. Your order will be confirmed upon successful payment.'
    );

    return true;

  } catch (error) {
    console.error('Error opening UPI app or payment initiation:', error);
    Alert.alert(
      'Payment Error',
      'Could not initiate UPI payment. Please try again.'
    );
    return false; 
  }
};

export default initiateUpiPayment;
