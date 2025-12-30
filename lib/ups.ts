// UPS API Integration for Ship Back Labels
// Docs: https://developer.ups.com/

const UPS_BASE_URL = 'https://onlinetools.ups.com/api'
const UPS_SANDBOX_URL = 'https://wwwcie.ups.com/api' // For testing

// Use sandbox for development, production for live
const API_URL = process.env.NODE_ENV === 'production' ? UPS_BASE_URL : UPS_SANDBOX_URL

interface UPSAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ShipFromAddress {
  street: string
  city: string
  state: string
  zip: string
  country?: string
}

interface ShipToAddress {
  name: string
  street: string
  city: string
  state: string
  zip: string
  country?: string
  phone?: string
}

interface PackageInfo {
  weight: number // in lbs
  length: number // in inches
  width: number
  height: number
  description: string
}

interface RateResult {
  service: string
  totalPrice: number // in cents
  estimatedDays: number
}

interface LabelResult {
  trackingNumber: string
  labelImageBase64: string
  labelUrl?: string
}

// Get OAuth token from UPS
async function getAccessToken(): Promise<string> {
  const clientId = process.env.UPS_CLIENT_ID
  const clientSecret = process.env.UPS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('UPS credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${API_URL}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('UPS Auth Error:', error)
    throw new Error('Failed to authenticate with UPS')
  }

  const data: UPSAuthResponse = await response.json()
  return data.access_token
}

// Get shipping rate for a package
export async function getShippingRate(
  shipFrom: ShipFromAddress,
  shipTo: ShipToAddress,
  packageInfo: PackageInfo
): Promise<RateResult> {
  const accessToken = await getAccessToken()
  const accountNumber = process.env.UPS_ACCOUNT_NUMBER

  if (!accountNumber) {
    throw new Error('UPS account number not configured')
  }

  const requestBody = {
    RateRequest: {
      Request: {
        RequestOption: 'Rate',
        TransactionReference: {
          CustomerContext: 'Ooloo Ship Back',
        },
      },
      Shipment: {
        Shipper: {
          Name: 'Ooloo Customer',
          ShipperNumber: accountNumber,
          Address: {
            AddressLine: [shipFrom.street],
            City: shipFrom.city,
            StateProvinceCode: shipFrom.state,
            PostalCode: shipFrom.zip,
            CountryCode: shipFrom.country || 'US',
          },
        },
        ShipTo: {
          Name: shipTo.name,
          Address: {
            AddressLine: [shipTo.street],
            City: shipTo.city,
            StateProvinceCode: shipTo.state,
            PostalCode: shipTo.zip,
            CountryCode: shipTo.country || 'US',
          },
        },
        ShipFrom: {
          Name: 'Ooloo Customer',
          Address: {
            AddressLine: [shipFrom.street],
            City: shipFrom.city,
            StateProvinceCode: shipFrom.state,
            PostalCode: shipFrom.zip,
            CountryCode: shipFrom.country || 'US',
          },
        },
        Service: {
          Code: '03', // UPS Ground
          Description: 'Ground',
        },
        Package: {
          PackagingType: {
            Code: '02', // Customer Supplied Package
            Description: 'Package',
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: 'IN',
              Description: 'Inches',
            },
            Length: String(packageInfo.length),
            Width: String(packageInfo.width),
            Height: String(packageInfo.height),
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'LBS',
              Description: 'Pounds',
            },
            Weight: String(packageInfo.weight),
          },
        },
      },
    },
  }

  const response = await fetch(`${API_URL}/rating/v1/Rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'transId': `ooloo-${Date.now()}`,
      'transactionSrc': 'Ooloo',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('UPS Rate Error:', error)
    throw new Error('Failed to get shipping rate from UPS')
  }

  const data = await response.json()
  const ratedShipment = data.RateResponse?.RatedShipment

  if (!ratedShipment) {
    throw new Error('No rate returned from UPS')
  }

  const totalCharges = ratedShipment.TotalCharges?.MonetaryValue || '0'
  const transitDays = ratedShipment.GuaranteedDelivery?.BusinessDaysInTransit || '5'

  return {
    service: 'UPS Ground',
    totalPrice: Math.round(parseFloat(totalCharges) * 100), // Convert to cents
    estimatedDays: parseInt(transitDays, 10),
  }
}

// Create shipping label
export async function createShippingLabel(
  shipFrom: ShipFromAddress,
  shipTo: ShipToAddress,
  packageInfo: PackageInfo,
  customerEmail: string
): Promise<LabelResult> {
  const accessToken = await getAccessToken()
  const accountNumber = process.env.UPS_ACCOUNT_NUMBER

  if (!accountNumber) {
    throw new Error('UPS account number not configured')
  }

  const requestBody = {
    ShipmentRequest: {
      Request: {
        RequestOption: 'nonvalidate',
        TransactionReference: {
          CustomerContext: 'Ooloo Ship Back Label',
        },
      },
      Shipment: {
        Description: packageInfo.description,
        Shipper: {
          Name: 'Ooloo Customer',
          ShipperNumber: accountNumber,
          Address: {
            AddressLine: [shipFrom.street],
            City: shipFrom.city,
            StateProvinceCode: shipFrom.state,
            PostalCode: shipFrom.zip,
            CountryCode: shipFrom.country || 'US',
          },
        },
        ShipTo: {
          Name: shipTo.name,
          AttentionName: 'Returns Department',
          Phone: {
            Number: shipTo.phone || '8005551234',
          },
          Address: {
            AddressLine: [shipTo.street],
            City: shipTo.city,
            StateProvinceCode: shipTo.state,
            PostalCode: shipTo.zip,
            CountryCode: shipTo.country || 'US',
          },
        },
        ShipFrom: {
          Name: 'Ooloo Customer',
          Address: {
            AddressLine: [shipFrom.street],
            City: shipFrom.city,
            StateProvinceCode: shipFrom.state,
            PostalCode: shipFrom.zip,
            CountryCode: shipFrom.country || 'US',
          },
        },
        PaymentInformation: {
          ShipmentCharge: {
            Type: '01', // Transportation
            BillShipper: {
              AccountNumber: accountNumber,
            },
          },
        },
        Service: {
          Code: '03', // UPS Ground
          Description: 'Ground',
        },
        Package: {
          Description: packageInfo.description,
          Packaging: {
            Code: '02', // Customer Supplied Package
            Description: 'Package',
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: 'IN',
              Description: 'Inches',
            },
            Length: String(packageInfo.length),
            Width: String(packageInfo.width),
            Height: String(packageInfo.height),
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'LBS',
              Description: 'Pounds',
            },
            Weight: String(packageInfo.weight),
          },
        },
        LabelSpecification: {
          LabelImageFormat: {
            Code: 'PDF',
            Description: 'PDF',
          },
          LabelStockSize: {
            Height: '6',
            Width: '4',
          },
        },
      },
    },
  }

  const response = await fetch(`${API_URL}/shipments/v1/ship`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'transId': `ooloo-label-${Date.now()}`,
      'transactionSrc': 'Ooloo',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('UPS Shipping Error:', error)
    throw new Error('Failed to create shipping label')
  }

  const data = await response.json()
  const shipmentResults = data.ShipmentResponse?.ShipmentResults

  if (!shipmentResults) {
    throw new Error('No shipment results returned from UPS')
  }

  const trackingNumber = shipmentResults.ShipmentIdentificationNumber
  const labelImage = shipmentResults.PackageResults?.[0]?.ShippingLabel?.GraphicImage

  return {
    trackingNumber,
    labelImageBase64: labelImage,
  }
}

// Luggage package dimensions (approximate)
export const LUGGAGE_DIMENSIONS = {
  carryon: { length: 22, width: 14, height: 9, weight: 10 },
  large: { length: 30, width: 20, height: 12, weight: 15 },
  set: { length: 32, width: 22, height: 14, weight: 25 }, // Both together
}

// Default return hub (will be fetched from DB in production)
export const DEFAULT_RETURN_HUB = {
  name: 'Ooloo HQ',
  street: '123 Main Street',
  city: 'Sherman Oaks',
  state: 'CA',
  zip: '91423',
  phone: '8005551234',
}