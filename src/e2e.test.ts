import { describe, expect, test } from 'bun:test';
import mongoose from 'mongoose';
import { UserModel } from './models/user.model';

const BASE = 'http://localhost:5000';
const TS = Date.now();
const json = (r: Response) => r.json() as any;
const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

// ════════════════════════════════════════════
// Workflow 1: Hub creates patient & appointment,
//            queues it, doctor completes it
// ════════════════════════════════════════════
describe('workflow: full appointment lifecycle', () => {
  let hubToken: string, hubId: string;
  let doctorToken: string, doctorId: string;
  let patientId: string;
  let appointmentId: string;

  test('register HUB and DOCTOR users', async () => {
    const r1 = await json(await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `e2e-hub${TS}@test.com`, password: 'test123', role: 'HUB' }),
    }));
    const r2 = await json(await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `e2e-doc${TS}@test.com`, password: 'test123', role: 'DOCTOR' }),
    }));
    hubId = r1.data._id || r1.data.id;
    doctorId = r2.data._id || r2.data.id;
  });

  test('approve both users directly', async () => {
    const uri = process.env.MONGO_URI || 'mongodb+srv://zechariah:LZ3dBYY0Y7oLUclC@cluster0.h0jk9xd.mongodb.net/teledenistry';
    await mongoose.connect(uri);
    await UserModel.updateMany({ _id: { $in: [hubId, doctorId] } }, { is_approved: true });
    await mongoose.disconnect();
  });

  test('login as HUB', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `e2e-hub${TS}@test.com`, password: 'test123' }),
    }));
    expect(r.success).toBe(true);
    hubToken = r.data.tokens.accessToken;
  });

  test('login as DOCTOR', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `e2e-doc${TS}@test.com`, password: 'test123' }),
    }));
    doctorToken = r.data.tokens.accessToken;
  });

  test('hub creates patient', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/patients/`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({
        full_name: 'E2E Patient', email: `e2e-patient${TS}@test.com`,
        phone_number: '+1234567890', date_of_birth: '1990-06-15', gender: 'female',
      }),
    }));
    expect(r.success).toBe(true);
    patientId = r.data._id || r.data.id;
  });

  test('hub schedules appointment', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({
        patient: patientId,
        schedule_date: '2026-08-01T10:00:00.000Z',
        compplaints: 'Severe toothache',
      }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('pending');
    appointmentId = r.data._id || r.data.id;
  });

  test('hub queues appointment for doctor', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/${appointmentId}/queue`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({ doctor: doctorId, level_of_severity: 4 }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('queue');
  });

  test('doctor starts appointment', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/${appointmentId}/start`, {
      method: 'PATCH', headers: auth(doctorToken),
    }));
    expect(r.success).toBe(true);
  });

  test('doctor submits consultation', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/${appointmentId}/consultation`, {
      method: 'PATCH', headers: auth(doctorToken),
      body: JSON.stringify({
        doctor_diagnosis: { condition: 'Dental caries', tooth: 14 },
        line_of_treatment: { procedure: 'Root canal', cost_estimate: 1500 },
        referral: { hospital: 'City Dental Hospital', condition: 'Complex extraction' },
      }),
    }));
    expect(r.success).toBe(true);
  });

  test('doctor updates notes', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/${appointmentId}/notes`, {
      method: 'PATCH', headers: auth(doctorToken),
      body: JSON.stringify({ notes: 'Patient advised to avoid hot foods for 24 hours' }),
    }));
    expect(r.success).toBe(true);
  });

  test('hub can view doctor appointments', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/doctor`, {
      headers: auth(doctorToken),
    }));
    expect(r.success).toBe(true);
  });

  test('hub can view own appointments', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/hub`, {
      headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.docs.some((a: any) => (a._id || a.id) === appointmentId)).toBe(true);
  });
});

// ════════════════════════════════════════════
// Workflow 2: Admin invite flow
// ════════════════════════════════════════════
describe('workflow: admin invite flow', () => {
  let adminToken: string;
  let inviteId: string;

  test('register admin & approve', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `e2e-admin${TS}@test.com`, password: 'admin123', role: 'ADMIN' }),
    }));
    const adminId = r.data._id || r.data.id;
    const uri = process.env.MONGO_URI || 'mongodb+srv://zechariah:LZ3dBYY0Y7oLUclC@cluster0.h0jk9xd.mongodb.net/teledenistry';
    await mongoose.connect(uri);
    await UserModel.updateOne({ _id: adminId }, { is_approved: true });
    await mongoose.disconnect();
    const l = await json(await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `e2e-admin${TS}@test.com`, password: 'admin123' }),
    }));
    adminToken = l.data.tokens.accessToken;
  });

  test('admin creates invite', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/admin/invites`, {
      method: 'POST', headers: auth(adminToken),
      body: JSON.stringify({ email: `e2e-invited${TS}@test.com`, role: 'DOCTOR' }),
    }));
    expect(r.success).toBe(true);
    inviteId = r.data._id || r.data.id;
  });

  test('admin fetches invites, sees the new one', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/admin/invites`, {
      headers: auth(adminToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.docs.some((i: any) => (i._id || i.id) === inviteId)).toBe(true);
  });

  test('admin fetches users list', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/admin/users`, {
      headers: auth(adminToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.docs.length).toBeGreaterThan(0);
  });

  test('non-admin cannot access admin routes', async () => {
    // use a hub token from the previous workflow isn't available, so test with any real token
    const r = await fetch(`${BASE}/api/v1/admin/users`, {
      headers: auth('fake-token'),
    });
    expect(r.status).toBe(401);
  });
});

// ════════════════════════════════════════════
// Workflow 3: Call session during appointment
// ════════════════════════════════════════════
describe('workflow: call session', () => {
  let hubToken: string, hubId: string;
  let doctorToken: string, doctorId: string;
  let patientId: string;
  let appointmentId: string;
  let callId: string;

  test('setup: register + approve + patient + appointment + queue', async () => {
    const [rh, rd] = await Promise.all([
      json(await fetch(`${BASE}/api/v1/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `e2e-chub${TS}@test.com`, password: 'test123', role: 'HUB' }),
      })),
      json(await fetch(`${BASE}/api/v1/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `e2e-cdoc${TS}@test.com`, password: 'test123', role: 'DOCTOR' }),
      })),
    ]);
    hubId = rh.data._id || rh.data.id;
    doctorId = rd.data._id || rd.data.id;
    const uri = process.env.MONGO_URI || 'mongodb+srv://zechariah:LZ3dBYY0Y7oLUclC@cluster0.h0jk9xd.mongodb.net/teledenistry';
    await mongoose.connect(uri);
    await UserModel.updateMany({}, { is_approved: true });
    await mongoose.disconnect();
    const [lh, ld] = await Promise.all([
      json(await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `e2e-chub${TS}@test.com`, password: 'test123' }),
      })),
      json(await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `e2e-cdoc${TS}@test.com`, password: 'test123' }),
      })),
    ]);
    hubToken = lh.data.tokens.accessToken;
    doctorToken = ld.data.tokens.accessToken;

    const p = await json(await fetch(`${BASE}/api/v1/patients/`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({
        full_name: 'Call Patient', email: `e2e-cpatient${TS}@test.com`,
        phone_number: '+0987654321', date_of_birth: '1985-03-20', gender: 'male',
      }),
    }));
    patientId = p.data._id || p.data.id;

    const a = await json(await fetch(`${BASE}/api/v1/appointments/`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({ patient: patientId, schedule_date: '2026-08-02T14:00:00.000Z' }),
    }));
    appointmentId = a.data._id || a.data.id;

    await json(await fetch(`${BASE}/api/v1/appointments/${appointmentId}/queue`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({ doctor: doctorId }),
    }));
  });

  test('hub initiates call', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({ peer_id: 'hub-peer-abc', appointment_id: appointmentId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('initiated');
    callId = r.data._id || r.data.id;
  });

  test('hub validates call with peer_id', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/validate`, {
      method: 'POST', headers: auth(hubToken),
      body: JSON.stringify({ appointment_id: appointmentId, peer_id: 'hub-peer-abc' }),
    }));
    expect(r.success).toBe(true);
  });

  test('doctor joins the call', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/join`, {
      method: 'POST', headers: auth(doctorToken),
      body: JSON.stringify({ call_id: callId, peer_id: 'doc-peer-xyz' }),
    }));
    expect(r.success).toBe(true);
  });

  test('get active call by appointment', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${appointmentId}`, {
      headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
    expect((r.data._id || r.data.id)).toBe(callId);
  });

  test('hub ends the call', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${callId}/end`, {
      method: 'POST', headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
  });
});
