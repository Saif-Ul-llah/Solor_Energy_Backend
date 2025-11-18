# Modbus API Usage Examples

## Quick Start Guide

### Prerequisites
1. JWT authentication token
2. Inverter serial number (e.g., `ES6G12345678`)
3. User must have `memberId` (customer email) associated

---

## 🚀 Example 1: Read All Inverter Settings

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/device/modbus/ES6G12345678/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "message": "Modbus registers read successfully",
  "data": {
    "serial": "ES6G12345678",
    "registersRequested": ["2110", "21B6", "5000", ...],
    "data": {
      "Battery Setting": {
        "Battery type": { "value": 1, "unit": "enum", "reg": "2110" },
        "Battery capacity": { "value": 200, "unit": "Ah", "reg": "21B6" }
      },
      "Grid Settings": {
        "Frequency High Loss Level_1(Hz)": {
          "value": 51.5,
          "unit": "Hz",
          "reg": "5002",
          "raw": "5150"
        }
      }
    }
  }
}
```

---

## 🔋 Example 2: Read Only Battery Settings

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/device/modbus/ES6G12345678/read?registers=2110,21B6,21B4,21BD" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript/TypeScript:**
```typescript
const readBatterySettings = async (sn: string, token: string) => {
  const registers = '2110,21B6,21B4,21BD';
  
  const response = await fetch(
    `${API_BASE}/device/modbus/${sn}/read?registers=${registers}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  );
  
  const data = await response.json();
  
  if (data.status === 'success') {
    const batteryData = data.data.data['Battery Setting'];
    console.log('Battery Type:', batteryData['Battery type'].value);
    console.log('Capacity:', batteryData['Battery capacity'].value, 'Ah');
    console.log('Efficiency:', batteryData['Batt charge efficiency'].value, '%');
  }
};
```

---

## ⚡ Example 3: Update Grid Protection Settings

**cURL:**
```bash
curl -X POST "http://localhost:3000/api/device/modbus/ES6G12345678/write" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registers": {
      "5002": 5200,
      "5003": 4800,
      "5004": 2640,
      "5005": 1950
    }
  }'
```

**JavaScript/TypeScript:**
```typescript
const updateGridProtection = async (sn: string, token: string) => {
  // First, read current values
  const current = await fetch(
    `${API_BASE}/device/modbus/${sn}/read?registers=5002,5003,5004,5005`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  ).then(r => r.json());
  
  console.log('Current Grid Settings:', current.data.data['Grid Settings']);
  
  // Then, update with new values (in RAW format)
  const response = await fetch(
    `${API_BASE}/device/modbus/${sn}/write`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registers: {
          '5002': 5200,  // 52.0 Hz (high freq limit)
          '5003': 4800,  // 48.0 Hz (low freq limit)
          '5004': 2640,  // 264.0 V (high voltage limit)
          '5005': 1950   // 195.0 V (low voltage limit)
        }
      })
    }
  );
  
  return await response.json();
};
```

---

## 🌐 Example 4: Configure WiFi Network

**JavaScript/TypeScript:**
```typescript
const configureWiFi = async (
  sn: string,
  token: string,
  ssid: string,
  password: string
) => {
  const response = await fetch(
    `${API_BASE}/device/modbus/${sn}/write`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registers: {
          '3060': ssid,
          '3070': password
        }
      })
    }
  );
  
  return await response.json();
};

// Usage
await configureWiFi('ES6G12345678', token, 'MyHomeNetwork', 'SecurePass123');
```

---

## 🔍 Example 5: Get Register Map (Discover Available Registers)

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/device/modbus/register-map" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript/TypeScript:**
```typescript
const getRegisterMap = async (token: string) => {
  const response = await fetch(
    `${API_BASE}/device/modbus/register-map`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  );
  
  const data = await response.json();
  
  console.log('Total Registers:', data.data.totalRegisters);
  console.log('Sections:', Object.keys(data.data.sections));
  
  // List all Battery Setting registers
  const batteryRegs = data.data.sections['Battery Setting'];
  batteryRegs.forEach(reg => {
    console.log(`${reg.register}: ${reg.field} (${reg.unit})`);
  });
};
```

---

## 💡 Example 6: Smart Power Management

**Complete Flow:**
```typescript
interface ModbusConfig {
  powerLimit: number;        // Watts
  maxFeedIn: number;         // Watts
  batteryCapacity: number;   // Ah
}

const configurePowerManagement = async (
  sn: string,
  token: string,
  config: ModbusConfig
) => {
  // Step 1: Read current settings
  console.log('Reading current configuration...');
  const current = await fetch(
    `${API_BASE}/device/modbus/${sn}/read?registers=3005,30B9,21B6`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(r => r.json());
  
  console.log('Current Power Control:', 
    current.data.data['Advance Setting']['Power control'].value, 'W'
  );
  console.log('Current Max Feed-in:', 
    current.data.data['Advance Setting']['Maximum feed in grid power(W)'].value, 'W'
  );
  console.log('Current Battery Capacity:', 
    current.data.data['Battery Setting']['Battery capacity'].value, 'Ah'
  );
  
  // Step 2: Validate new settings
  if (config.powerLimit > 15000 || config.powerLimit < 0) {
    throw new Error('Power limit out of range (0-15000W)');
  }
  
  // Step 3: Write new configuration
  console.log('Writing new configuration...');
  const result = await fetch(
    `${API_BASE}/device/modbus/${sn}/write`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registers: {
          '3005': config.powerLimit,      // Power control (W)
          '30B9': config.maxFeedIn,        // Max feed-in (W)
          '21B6': config.batteryCapacity   // Battery capacity (Ah)
        }
      })
    }
  ).then(r => r.json());
  
  console.log('Configuration updated:', result);
  
  // Step 4: Verify changes
  console.log('Verifying changes...');
  const verified = await fetch(
    `${API_BASE}/device/modbus/${sn}/read?registers=3005,30B9,21B6`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(r => r.json());
  
  console.log('Verified settings:', verified.data.data);
  
  return result;
};

// Usage
await configurePowerManagement('ES6G12345678', token, {
  powerLimit: 5000,
  maxFeedIn: 8000,
  batteryCapacity: 200
});
```

---

## 📊 Example 7: Bulk Register Update (Grid Standards)

**Update Multiple Grid Protection Levels:**
```typescript
const applyGridStandard = async (
  sn: string,
  token: string,
  standard: 'EU' | 'UK' | 'US'
) => {
  const standards = {
    EU: {
      '5002': 5150,  // 51.5 Hz high
      '5003': 4750,  // 47.5 Hz low
      '5004': 2530,  // 253 V high
      '5005': 1960,  // 196 V low
      '5006': 200,   // Freq high time (ms)
      '5007': 200,   // Freq low time (ms)
      '5008': 1500,  // Volt high time (ms)
      '5009': 2000,  // Volt low time (ms)
    },
    UK: {
      '5002': 5130,  // 51.3 Hz high
      '5003': 4730,  // 47.3 Hz low
      '5004': 2530,  // 253 V high
      '5005': 2070,  // 207 V low
      '5006': 500,
      '5007': 500,
      '5008': 1000,
      '5009': 1500,
    },
    US: {
      '5002': 6050,  // 60.5 Hz high
      '5003': 5950,  // 59.5 Hz low
      '5004': 1320,  // 132 V high (120V system)
      '5005': 1060,  // 106 V low
      '5006': 160,
      '5007': 160,
      '5008': 1000,
      '5009': 2000,
    }
  };
  
  const registers = standards[standard];
  
  const response = await fetch(
    `${API_BASE}/device/modbus/${sn}/write`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registers })
    }
  );
  
  return await response.json();
};

// Apply EU grid standard
await applyGridStandard('ES6G12345678', token, 'EU');
```

---

## 🛡️ Example 8: Error Handling & Retry Logic

**Robust Implementation:**
```typescript
const readRegistersWithRetry = async (
  sn: string,
  token: string,
  registers?: string[],
  maxRetries = 3
) => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const query = registers ? `?registers=${registers.join(',')}` : '';
      const response = await fetch(
        `${API_BASE}/device/modbus/${sn}/read${query}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 30000, // 30 second timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        return data;
      } else {
        throw new Error(data.message || 'Unknown error');
      }
      
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(
    `Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
};
```

---

## 📈 Example 9: Monitor & Log Changes

**Track Register Changes Over Time:**
```typescript
interface RegisterSnapshot {
  timestamp: Date;
  serialNumber: string;
  registers: Record<string, any>;
}

const monitorInverterSettings = async (
  sn: string,
  token: string,
  intervalMinutes = 15
) => {
  const snapshots: RegisterSnapshot[] = [];
  
  const captureSnapshot = async () => {
    const data = await fetch(
      `${API_BASE}/device/modbus/${sn}/read`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).then(r => r.json());
    
    const snapshot: RegisterSnapshot = {
      timestamp: new Date(),
      serialNumber: sn,
      registers: data.data.raw
    };
    
    snapshots.push(snapshot);
    
    // Compare with previous snapshot
    if (snapshots.length > 1) {
      const prev = snapshots[snapshots.length - 2];
      const changes = findChanges(prev.registers, snapshot.registers);
      
      if (changes.length > 0) {
        console.log('⚠️ Register changes detected:');
        changes.forEach(change => {
          console.log(
            `  ${change.register}: ${change.oldValue} → ${change.newValue}`
          );
        });
      }
    }
  };
  
  // Initial capture
  await captureSnapshot();
  
  // Schedule periodic captures
  const intervalId = setInterval(captureSnapshot, intervalMinutes * 60 * 1000);
  
  return () => {
    clearInterval(intervalId);
    return snapshots;
  };
};

const findChanges = (
  oldRegs: Record<string, any>,
  newRegs: Record<string, any>
) => {
  const changes: Array<{
    register: string;
    oldValue: any;
    newValue: any;
  }> = [];
  
  for (const [reg, newValue] of Object.entries(newRegs)) {
    if (oldRegs[reg] !== newValue) {
      changes.push({
        register: reg,
        oldValue: oldRegs[reg],
        newValue: newValue
      });
    }
  }
  
  return changes;
};
```

---

## 🧪 Example 10: Testing Suite

**Unit Test Example (Jest):**
```typescript
describe('Modbus API Integration', () => {
  const TEST_SN = 'ES6G12345678';
  let authToken: string;
  
  beforeAll(async () => {
    // Get authentication token
    const auth = await login('test@example.com', 'password');
    authToken = auth.token;
  });
  
  test('should read all registers', async () => {
    const response = await fetch(
      `${API_BASE}/device/modbus/${TEST_SN}/read`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    const data = await response.json();
    
    expect(data.status).toBe('success');
    expect(data.data.serial).toBe(TEST_SN);
    expect(data.data.data).toHaveProperty('Battery Setting');
    expect(data.data.data).toHaveProperty('Grid Settings');
  });
  
  test('should read specific registers', async () => {
    const registers = '2110,21B6';
    const response = await fetch(
      `${API_BASE}/device/modbus/${TEST_SN}/read?registers=${registers}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    const data = await response.json();
    
    expect(data.status).toBe('success');
    expect(data.data.registersRequested).toContain('2110');
    expect(data.data.registersRequested).toContain('21B6');
  });
  
  test('should write and verify register', async () => {
    const testValue = 150; // Battery capacity
    
    // Write
    await fetch(
      `${API_BASE}/device/modbus/${TEST_SN}/write`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registers: { '21B6': testValue }
        })
      }
    );
    
    // Wait for register to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Read back and verify
    const response = await fetch(
      `${API_BASE}/device/modbus/${TEST_SN}/read?registers=21B6`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    const data = await response.json();
    const capacity = data.data.data['Battery Setting']['Battery capacity'].value;
    
    expect(capacity).toBe(testValue);
  });
  
  test('should get register map', async () => {
    const response = await fetch(
      `${API_BASE}/device/modbus/register-map`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    const data = await response.json();
    
    expect(data.status).toBe('success');
    expect(data.data.totalRegisters).toBeGreaterThan(0);
    expect(data.data.sections).toHaveProperty('Battery Setting');
  });
});
```

---

## 🎯 Pro Tips

1. **Always Read Before Write:** Check current values before making changes
2. **Use Register Map:** Get the complete map to discover all available registers
3. **Batch Operations:** Read/write multiple registers in one call
4. **Error Handling:** Implement retry logic with exponential backoff
5. **Value Validation:** Validate ranges before writing
6. **Monitor Changes:** Log all register modifications for audit trail
7. **Test Environment:** Test on development inverters first
8. **Caching:** Cache register map and rarely-changing values

---

## 📞 Support

For issues or questions:
1. Check the main documentation: `MODBUS_API_DOCUMENTATION.md`
2. Review the Senergy Modbus Protocol PDF
3. Verify inverter connectivity and model compatibility

