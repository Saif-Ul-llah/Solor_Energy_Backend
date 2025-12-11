# Generator Control API Documentation

## 📋 Overview

Control and monitor generator functionality on Senergy inverters. The generator is controlled by two Modbus registers:

- **Register 2122 (0x2122)**: GEN Port Configuration
- **Register 2156 (0x2156)**: Generator Dry Force ON/OFF

---

## 🎯 Generator Logic

### Generator is Active When:
```
✅ GEN Port (2122) = 1 (Generator Input)
   AND
✅ Generator Force (2156) ≠ 2 (Not forced OFF)
```

### Truth Table

| GEN Port (2122) | Gen Force (2156) | Generator Active? | Reason |
|-----------------|------------------|-------------------|--------|
| 0 (Disable) | Any | ❌ | Port disabled |
| 1 (Generator) | 0 (Auto) | ✅ | Enabled, auto mode |
| 1 (Generator) | 1 (On) | ✅ | Enabled, forced on |
| 1 (Generator) | 2 (Off) | ❌ | Forced off |
| 2 (Smart Load) | Any | ❌ | Port used for Smart Load |
| 3 (Inverter) | Any | ❌ | Port used for another inverter |

---

## 🚀 API Endpoints

### 1. Get Generator Status
**GET** `/api/device/generator/:sn/:memberId/status`

Check if generator is enabled and get current configuration.

**Parameters:**
- `sn` - Serial number of the inverter
- `memberId` - Customer email/member ID

**Response:**
```json
{
  "status": "success",
  "message": "Generator status retrieved successfully",
  "data": {
    "enabled": true,
    "genPort": {
      "value": 1,
      "description": "Generator Input"
    },
    "genForce": {
      "value": 0,
      "description": "Auto"
    },
    "status": "Generator is ENABLED and operational"
  }
}
```

---

### 2. Control Generator
**POST** `/api/device/generator/:sn/:memberId/control`

Turn generator ON, OFF, or set to AUTO mode.

**Parameters:**
- `sn` - Serial number
- `memberId` - Customer email

**Request Body:**
```json
{
  "mode": 1
}
```

**Mode Values:**
- `0` - **Auto** (Generator runs based on system logic)
- `1` - **On** (Force generator ON)
- `2` - **Off** (Force generator OFF)

**Response:**
```json
{
  "status": "success",
  "message": "Generator control command sent (mode=1)",
  "data": {
    "status": "...",
    "message": "Generator On command sent. Result will arrive via callback.",
    "callbackUrl": "https://your-domain.com/api/device/modbus/callback/write-result",
    "registersWritten": ["2156"],
    "mode": 1,
    "modeDescription": "On"
  }
}
```

---

### 3. Get Device Flow (Enhanced with Generator)
**GET** `/api/device/getDeviceDetails?sn=XXX`

Returns energy flow data. **Generator field is only included if enabled.**

**Response (Generator Enabled):**
```json
{
  "status": "success",
  "data": {
    "PV": 2500,
    "Grid": 1200,
    "Battery": 800,
    "Generator": 3000,              // ← Only present if enabled
    "LoadConsumed": 7500,
    "deviceType": "INVERTER",
    "generatorStatus": {             // ← Debug info
      "genPort": 1,
      "genForce": 0,
      "enabled": true,
      "reason": "Generator enabled (Port=1, Force=0)"
    }
  }
}
```

**Response (Generator Disabled):**
```json
{
  "status": "success",
  "data": {
    "PV": 2500,
    "Grid": 1200,
    "Battery": 800,
    // No Generator field
    "LoadConsumed": 4500,
    "deviceType": "INVERTER"
  }
}
```

---

## 📝 Usage Examples

### Example 1: Check Generator Status

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/device/generator/ES6G12345678/progziel01/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript:**
```typescript
const checkGeneratorStatus = async (sn: string, memberId: string, token: string) => {
  const response = await fetch(
    `/api/device/generator/${sn}/${memberId}/status`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Generator Enabled:', data.data.enabled);
    console.log('GEN Port:', data.data.genPort.description);
    console.log('Control Mode:', data.data.genForce.description);
    console.log('Status:', data.data.status);
  }
  
  return data.data;
};
```

---

### Example 2: Turn Generator ON

**cURL:**
```bash
curl -X POST "http://localhost:5000/api/device/generator/ES6G12345678/progziel01/control" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": 1}'
```

**JavaScript:**
```typescript
const turnGeneratorOn = async (sn: string, memberId: string, token: string) => {
  const response = await fetch(
    `/api/device/generator/${sn}/${memberId}/control`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 1 }) // 1 = On
    }
  );
  
  const data = await response.json();
  console.log('✅ Command sent:', data.message);
  console.log('⏳ Waiting for callback...');
  
  return data;
};
```

---

### Example 3: Set Generator to AUTO

**cURL:**
```bash
curl -X POST "http://localhost:5000/api/device/generator/ES6G12345678/progziel01/control" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": 0}'
```

---

### Example 4: Turn Generator OFF

**cURL:**
```bash
curl -X POST "http://localhost:5000/api/device/generator/ES6G12345678/progziel01/control" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": 2}'
```

---

### Example 5: Complete Generator Management UI

**TypeScript/React:**
```typescript
const GeneratorControl = ({ serialNumber, memberId }: Props) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load generator status
  const loadStatus = async () => {
    const response = await fetch(
      `/api/device/generator/${serialNumber}/${memberId}/status`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setStatus(data.data);
  };

  // Control generator
  const controlGenerator = async (mode: 0 | 1 | 2) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/device/generator/${serialNumber}/${memberId}/control`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mode })
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success(`Generator ${['Auto', 'On', 'Off'][mode]} command sent`);
        
        // Refresh status after delay
        setTimeout(() => loadStatus(), 60000); // Check after 1 minute
      }
    } catch (error) {
      toast.error('Failed to control generator');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (!status) return <Loading />;

  return (
    <div className="generator-control">
      <h3>Generator Control</h3>
      
      {/* Status Display */}
      <div className={`status ${status.enabled ? 'enabled' : 'disabled'}`}>
        <span className="indicator">
          {status.enabled ? '🟢' : '🔴'}
        </span>
        <span>{status.status}</span>
      </div>

      {/* Configuration Details */}
      <div className="config">
        <div>
          <strong>Port Configuration:</strong>
          <span>{status.genPort.description}</span>
        </div>
        <div>
          <strong>Control Mode:</strong>
          <span>{status.genForce.description}</span>
        </div>
      </div>

      {/* Control Buttons (only if port is configured as Generator) */}
      {status.genPort.value === 1 && (
        <div className="controls">
          <button
            onClick={() => controlGenerator(0)}
            disabled={loading || status.genForce.value === 0}
            className={status.genForce.value === 0 ? 'active' : ''}
          >
            ⚙️ Auto
          </button>
          
          <button
            onClick={() => controlGenerator(1)}
            disabled={loading || status.genForce.value === 1}
            className={status.genForce.value === 1 ? 'active' : ''}
          >
            ✅ Force ON
          </button>
          
          <button
            onClick={() => controlGenerator(2)}
            disabled={loading || status.genForce.value === 2}
            className={status.genForce.value === 2 ? 'active' : ''}
          >
            ⛔ Force OFF
          </button>
        </div>
      )}

      {/* Warning if port not configured */}
      {status.genPort.value !== 1 && (
        <div className="warning">
          ⚠️ Generator port is configured as: {status.genPort.description}
          <br />
          To use generator, set GEN Port to "Generator Input" via Modbus settings.
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 Complete Flow Example

```typescript
// Complete generator management workflow
const manageGenerator = async (sn: string, memberId: string, token: string) => {
  
  // Step 1: Check current status
  console.log('📊 Checking generator status...');
  const statusResponse = await fetch(
    `/api/device/generator/${sn}/${memberId}/status`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const statusData = await statusResponse.json();
  const status = statusData.data;
  
  console.log('Current Status:', status);
  
  // Step 2: Verify GEN Port is configured
  if (status.genPort.value !== 1) {
    console.log('⚠️ GEN Port not set to Generator. Configuring...');
    
    // Configure GEN Port to Generator Input
    await fetch(
      `/api/device/modbus/${sn}/${memberId}/write`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registers: { '2122': 1 } // Set to Generator Input
        })
      }
    );
    
    console.log('⏳ Waiting for configuration to apply...');
    await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
  }
  
  // Step 3: Turn generator ON
  console.log('🔌 Turning generator ON...');
  const controlResponse = await fetch(
    `/api/device/generator/${sn}/${memberId}/control`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 1 }) // Force ON
    }
  );
  const controlData = await controlResponse.json();
  
  console.log('✅ Command sent:', controlData.data.message);
  
  // Step 4: Wait and verify
  console.log('⏳ Waiting for command to take effect...');
  await new Promise(resolve => setTimeout(resolve, 90000)); // Wait 90 seconds
  
  // Step 5: Check flow diagram
  console.log('🔍 Verifying generator in flow diagram...');
  const flowResponse = await fetch(
    `/api/device/getDeviceDetails?sn=${sn}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const flowData = await flowResponse.json();
  
  if (flowData.data.Generator !== undefined) {
    console.log('✅ Generator is now active in energy flow!');
    console.log('Generator Power:', flowData.data.Generator, 'W');
  } else {
    console.log('⏳ Generator not yet active, may need more time...');
  }
  
  return flowData.data;
};
```

---

## 📊 Server Log Examples

### When Generator is Enabled
```
🔌 Generator Status for ES6G12345678: {
  genPort: 1,
  genForce: 0,
  enabled: true,
  reason: 'Generator enabled (Port=1, Force=0)'
}
```

### When Generator is Disabled (Port not configured)
```
🔌 Generator Status for ES6G12345678: {
  genPort: 0,
  genForce: 0,
  enabled: false,
  reason: 'GEN Port not set to Generator (value=0)'
}
```

### When Generator is Forced OFF
```
🔌 Generator Status for ES6G12345678: {
  genPort: 1,
  genForce: 2,
  enabled: false,
  reason: 'Generator forced OFF (value=2)'
}
```

---

## 🎨 Frontend Integration

### Simple Toggle Button
```typescript
const GeneratorToggle = ({ sn, memberId }: Props) => {
  const [enabled, setEnabled] = useState(false);

  const toggle = async () => {
    const newMode = enabled ? 2 : 1; // Toggle between On(1) and Off(2)
    
    await fetch(
      `/api/device/generator/${sn}/${memberId}/control`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: newMode })
      }
    );
    
    setEnabled(!enabled);
  };

  return (
    <button onClick={toggle}>
      {enabled ? '⚡ Turn OFF' : '🔌 Turn ON'}
    </button>
  );
};
```

### Advanced Control Panel
```typescript
const GeneratorPanel = ({ sn, memberId }: Props) => {
  const [status, setStatus] = useState<any>(null);
  const [flowData, setFlowData] = useState<any>(null);

  const loadData = async () => {
    // Load generator status
    const statusRes = await fetch(`/api/device/generator/${sn}/${memberId}/status`);
    const statusData = await statusRes.json();
    setStatus(statusData.data);

    // Load energy flow
    const flowRes = await fetch(`/api/device/getDeviceDetails?sn=${sn}`);
    const flow = await flowRes.json();
    setFlowData(flow.data);
  };

  const setMode = async (mode: 0 | 1 | 2) => {
    await fetch(
      `/api/device/generator/${sn}/${memberId}/control`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode })
      }
    );
    
    toast.info('Command sent. Changes may take 1-10 minutes to apply.');
    
    // Refresh after delay
    setTimeout(loadData, 90000); // Check after 90 seconds
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!status || !flowData) return <Loading />;

  return (
    <div className="generator-panel">
      {/* Status Badge */}
      <div className={`badge ${status.enabled ? 'enabled' : 'disabled'}`}>
        {status.enabled ? '🟢 Generator Active' : '🔴 Generator Inactive'}
      </div>

      {/* Power Display (if active) */}
      {flowData.Generator !== undefined && (
        <div className="power-display">
          <h3>Generator Output</h3>
          <div className="value">{flowData.Generator} W</div>
        </div>
      )}

      {/* Configuration */}
      <div className="config">
        <div className="config-item">
          <label>Port Mode:</label>
          <span className={status.genPort.value === 1 ? 'good' : 'warning'}>
            {status.genPort.description}
          </span>
        </div>
        
        <div className="config-item">
          <label>Control:</label>
          <span>{status.genForce.description}</span>
        </div>
      </div>

      {/* Control Buttons (only if port is Generator) */}
      {status.genPort.value === 1 ? (
        <div className="controls">
          <button 
            onClick={() => setMode(0)}
            className={status.genForce.value === 0 ? 'active' : ''}
          >
            ⚙️ Auto
          </button>
          
          <button 
            onClick={() => setMode(1)}
            className={status.genForce.value === 1 ? 'active' : ''}
          >
            ✅ Force ON
          </button>
          
          <button 
            onClick={() => setMode(2)}
            className={status.genForce.value === 2 ? 'active' : ''}
          >
            ⛔ Force OFF
          </button>
        </div>
      ) : (
        <div className="warning-box">
          ⚠️ Generator port not configured. 
          <br />
          Current mode: {status.genPort.description}
          <br />
          <button onClick={() => configurePort()}>
            Configure as Generator
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🔧 Configuration Scenarios

### Scenario 1: First-time Setup
```bash
# 1. Configure GEN Port to Generator Input
POST /api/device/modbus/SN/MEMBER/write
{ "registers": { "2122": 1 } }

# 2. Set to Auto mode
POST /api/device/generator/SN/MEMBER/control
{ "mode": 0 }

# 3. Verify in flow diagram
GET /api/device/getDeviceDetails?sn=SN
# Should include Generator field
```

### Scenario 2: Emergency Shutdown
```bash
# Force generator OFF immediately
POST /api/device/generator/SN/MEMBER/control
{ "mode": 2 }

# Generator field will be removed from flow diagram
# (after callback confirms change)
```

### Scenario 3: Maintenance Mode
```bash
# Turn ON for testing
POST /api/device/generator/SN/MEMBER/control
{ "mode": 1 }

# Check generator power
GET /api/device/getDeviceDetails?sn=SN
# Generator field should show current power

# Return to Auto after testing
POST /api/device/generator/SN/MEMBER/control
{ "mode": 0 }
```

---

## 📋 API Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/generator/:sn/:memberId/status` | GET | Check generator configuration | ✅ Yes |
| `/generator/:sn/:memberId/control` | POST | Control generator ON/OFF/Auto | ✅ Yes |
| `/getDeviceDetails` | GET | Get energy flow (includes Generator if enabled) | ✅ Yes |
| `/modbus/:sn/:memberId/read` | GET | Read any Modbus registers | ✅ Yes |
| `/modbus/:sn/:memberId/write` | POST | Write any Modbus registers | ✅ Yes |
| `/modbus/callback/write-result` | POST | Receive write results | ❌ No (vendor) |

---

## ⚡ Quick Command Reference

```bash
# Check generator status
GET /api/device/generator/{SN}/{MEMBER}/status

# Set to Auto mode
POST /api/device/generator/{SN}/{MEMBER}/control
Body: {"mode": 0}

# Force generator ON
POST /api/device/generator/{SN}/{MEMBER}/control
Body: {"mode": 1}

# Force generator OFF
POST /api/device/generator/{SN}/{MEMBER}/control
Body: {"mode": 2}

# Configure GEN Port (if needed)
POST /api/device/modbus/{SN}/{MEMBER}/write
Body: {"registers": {"2122": 1}}
```

---

## 🎯 Smart Generator Logic

The implementation automatically determines if Generator should be shown:

```typescript
// Pseudo-code of the logic
if (genPort === 1 && genForce !== 2) {
  // ✅ Show Generator in energy flow
  response.Generator = actualPowerValue;
} else {
  // ❌ Hide Generator from energy flow
  // (field not included in response)
}
```

This means:
- Frontend doesn't need complex logic
- Just check: `if (data.Generator !== undefined)`
- Clean, dynamic UI based on actual configuration

---

## 🚀 Your Generator Control is Complete!

✅ **Dual register check** (Port + Force)  
✅ **Smart inclusion** in flow diagram  
✅ **Dedicated control endpoints**  
✅ **Status monitoring**  
✅ **Detailed logging**  
✅ **Callback support**  
✅ **Frontend-ready responses**  

The generator will **automatically appear/disappear** from the energy flow based on actual inverter configuration! 🎉

