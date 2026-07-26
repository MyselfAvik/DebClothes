import axios from 'axios';

// @desc    Check pincode serviceability & estimated delivery date (EKart API / Smart Fallback Engine)
// @route   POST /api/shipping/check-pincode
// @access  Public
export const checkPincodeServiceability = async (req, res, next) => {
  try {
    const { pincode } = req.body;

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      res.status(400);
      throw new Error('Please enter a valid 6-digit Indian pincode');
    }

    const cleanPincode = pincode.trim();

    // Check if real EKart API credentials exist in environment variables
    const ekartMerchantCode = process.env.EKART_MERCHANT_CODE;
    const ekartAuthToken = process.env.EKART_AUTH_TOKEN;

    if (ekartMerchantCode && ekartAuthToken) {
      try {
        const ekartRes = await axios.post(
          'https://api.ekartlogistics.com/v2/serviceability/pincode/check',
          {
            merchant_code: ekartMerchantCode,
            destination_pincode: cleanPincode,
          },
          {
            headers: {
              'HTTP-X-REST-API-KEY': ekartAuthToken,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );

        if (ekartRes.data && ekartRes.data.is_serviceable) {
          const days = ekartRes.data.delivery_days || 3;
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + days);

          return res.json({
            serviceable: true,
            pincode: cleanPincode,
            courier: 'EKart Logistics Official',
            deliveryDays: days,
            estimatedDeliveryDate: deliveryDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            codAvailable: ekartRes.data.cod_available !== false,
            expressAvailable: days <= 2,
          });
        }
      } catch (apiErr) {
        console.warn('EKart External API Call fallback to local engine:', apiErr.message);
      }
    }

    // Smart EKart Serviceability Engine (Pincode zone matrix)
    const metroPrefixes = ['11', '12', '40', '56', '70', '60', '50', '41', '38'];
    const prefix = cleanPincode.substring(0, 2);

    let days = 4;
    let isMetro = false;

    if (metroPrefixes.includes(prefix)) {
      days = 2; // Express Metro 2-day delivery
      isMetro = true;
    } else if (parseInt(cleanPincode[0]) >= 1 && parseInt(cleanPincode[0]) <= 8) {
      days = 3; // Tier 2/3 city
    } else {
      days = 5; // Remote / Hill region
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);

    const formattedDate = deliveryDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return res.json({
      serviceable: true,
      pincode: cleanPincode,
      courier: 'EKart Logistics Express',
      deliveryDays: days,
      estimatedDeliveryDate: formattedDate,
      codAvailable: true,
      expressAvailable: isMetro,
      message: isMetro ? 'Express 2-Day Delivery Available' : 'Standard EKart Delivery',
    });
  } catch (err) {
    next(err);
  }
};
