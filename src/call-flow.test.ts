import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import { UserModel } from './models/user.model';
import { CallModel, CALL_STATUS } from './models/call.model';

const BASE = 'http://localhost:5000';
const json = (r: Response) => r.json() as any;
const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

const HUB_EMAIL = 'kehebi6567@copawoke.com';
const HUB_PASSWORD = '12345678';
const DOCTOR_EMAIL = 'dogima5077@copawoke.com';
const DOCTOR_PASSWORD = '12345678';

describe('workflow: full call flow with real credentials', () => {
  let hubToken: string, hubId: string;
  let doctorToken: string, doctorId: string;
  let patientId: string;
  let appointmentId: string;
  let callId: string;
  let hubPeerId: string;
  let doctorPeerId: string;

  beforeAll(async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('login as HUB', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: HUB_EMAIL, password: HUB_PASSWORD }),
    }));
    expect(r.success).toBe(true);
    hubToken = r.data.tokens.accessToken;
    hubId = r.data.user._id || r.data.user.id;
  });

  test('login as DOCTOR', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD }),
    }));
    expect(r.success).toBe(true);
    doctorToken = r.data.tokens.accessToken;
    doctorId = r.data.user._id || r.data.user.id;
  });

  test('hub creates a test patient', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/patients/`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({
        full_name: 'Call Test Patient',
        email: `calltest${Date.now()}@test.com`,
        phone_number: '+1234567890',
        date_of_birth: '1990-01-01',
        gender: 'male',
      }),
    }));
    expect(r.success).toBe(true);
    patientId = r.data._id || r.data.id;
  });

  test('hub creates a new appointment for call testing', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/appointments/`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({
        patient: patientId,
        schedule_date: new Date().toISOString(),
        complaints: 'Call flow test',
      }),
    }));
    expect(r.success).toBe(true);
    appointmentId = r.data._id || r.data.id;
  });

  // ═══════════════════════════════════════════
  // Phase 1: Hub initiates call (becomes host)
  // ════════════════════════════════════════════

  test('hub starts call — becomes host', async () => {
    hubPeerId = 'hub-peer-' + Date.now();
    const r = await json(await fetch(`${BASE}/api/v1/calls/`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({ peer_id: hubPeerId, appointment_id: appointmentId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('initiated');
    expect(r.data.host).toBe(hubPeerId);
    callId = r.data._id || r.data.id;
  });

  test('hub validates call (refreshes peer_id)', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/validate`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({ appointment_id: appointmentId, peer_id: hubPeerId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.hub_peer_id).toBe(hubPeerId);
  });

  test('get active call — hub is host', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${appointmentId}`, {
      headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.host).toBe(hubPeerId);
    expect(r.data.status).toBe('initiated');
  });

  // ═══════════════════════════════════════════
  // Phase 2: Doctor joins the call
  // ════════════════════════════════════════════

  test('doctor joins the call', async () => {
    doctorPeerId = 'doc-peer-' + Date.now();
    const r = await json(await fetch(`${BASE}/api/v1/calls/join`, {
      method: 'POST',
      headers: auth(doctorToken),
      body: JSON.stringify({ call_id: callId, peer_id: doctorPeerId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.doctor_peer_id).toBe(doctorPeerId);
  });

  test('doctor validates call', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/validate`, {
      method: 'POST',
      headers: auth(doctorToken),
      body: JSON.stringify({ appointment_id: appointmentId, peer_id: doctorPeerId }),
    }));
    expect(r.success).toBe(true);
  });

  test('get active call — both participants present', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${appointmentId}`, {
      headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.host).toBe(hubPeerId);
    expect(r.data.hub_peer_id).toBe(hubPeerId);
    expect(r.data.doctor_peer_id).toBe(doctorPeerId);
  });

  // ════════════════════════════════════════════
  // Phase 3: Hub refreshes peer_id (simulates page reload)
  // ════════════════════════════════════════════

  test('hub refreshes peer_id (simulates reload)', async () => {
    const newHubPeerId = 'hub-peer-reloaded-' + Date.now();
    const r = await json(await fetch(`${BASE}/api/v1/calls/refresh-peer`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({ appointment_id: appointmentId, peer_id: newHubPeerId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.hub_peer_id).toBe(newHubPeerId);
    expect(r.data.host).toBe(newHubPeerId);
    hubPeerId = newHubPeerId;
  });

  // ════════════════════════════════════════════
  // Phase 4: Hub ends call
  // ═══════════════════════════════════════════

  test('hub ends the call', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${callId}/end`, {
      method: 'POST',
      headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('ended');
    expect(r.data.hub_peer_id).toBeNull();
  });

  test('call is no longer active', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${appointmentId}`, {
      headers: auth(hubToken),
    }));
    if (r.data) {
      expect(r.data.status).toBe('ended');
    }
  });

  // ═══════════════════════════════════════════
  // Phase 5: New call — doctor starts first (becomes host)
  // ═══════════════════════════════════════════

  test('doctor starts call first — becomes host', async () => {
    const patient = await json(await fetch(`${BASE}/api/v1/patients/`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({
        full_name: 'Second Call Patient',
        email: `calltest2${Date.now()}@test.com`,
        phone_number: '+9876543210',
        date_of_birth: '1995-05-15',
        gender: 'female',
      }),
    }));
    expect(patient.success).toBe(true);

    const secondDate = new Date();
    secondDate.setHours(secondDate.getHours() + 2);

    const apt = await json(await fetch(`${BASE}/api/v1/appointments/`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({
        patient: patient.data._id || patient.data.id,
        schedule_date: secondDate.toISOString(),
        complaints: 'Second call test',
      }),
    }));
    expect(apt.success).toBe(true);
    const newAppointmentId = apt.data._id || apt.data.id;

    doctorPeerId = 'doc-peer-host-' + Date.now();
    const r = await json(await fetch(`${BASE}/api/v1/calls/`, {
      method: 'POST',
      headers: auth(doctorToken),
      body: JSON.stringify({ peer_id: doctorPeerId, appointment_id: newAppointmentId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.host).toBe(doctorPeerId);
    callId = r.data._id || r.data.id;
  });

  test('hub joins — doctor remains host', async () => {
    hubPeerId = 'hub-peer-join-' + Date.now();
    const r = await json(await fetch(`${BASE}/api/v1/calls/join`, {
      method: 'POST',
      headers: auth(hubToken),
      body: JSON.stringify({ call_id: callId, peer_id: hubPeerId }),
    }));
    expect(r.success).toBe(true);
    expect(r.data.host).toBe(doctorPeerId);
  });

  test('doctor ends call', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/${callId}/end`, {
      method: 'POST',
      headers: auth(doctorToken),
    }));
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('ended');
  });

  // ═══════════════════════════════════════════
  // Phase 6: ICE servers endpoint
  // ════════════════════════════════════════════

  test('fetch ICE servers', async () => {
    const r = await json(await fetch(`${BASE}/api/v1/calls/ice-servers`, {
      headers: auth(hubToken),
    }));
    expect(r.success).toBe(true);
    expect(Array.isArray(r.data)).toBe(true);
    expect(r.data.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════
// PeerJS signaling test — verifies two peers
// can connect via PeerJS cloud
// ════════════════════════════════════════════

describe('PeerJS: direct peer connection', () => {
  let Peer: any;

  beforeAll(async () => {
    const mod = await import('peerjs');
    Peer = mod.Peer;
  });

  test('two peers connect and exchange streams', async () => {
    // Skip in Node.js/Bun — WebRTC not available
    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('Skipping PeerJS test: WebRTC not available in this environment');
      return;
    }

    const peer1 = new Peer({ debug: 0 });
    const peer1Id = await new Promise<string>((resolve, reject) => {
      peer1.on('open', resolve);
      peer1.on('error', (e: any) => reject(new Error(`Peer1 error: ${e}`)));
      setTimeout(() => reject(new Error('PeerJS cloud timeout')), 10000);
    });

    const peer2 = new Peer({ debug: 0 });
    const peer2Id = await new Promise<string>((resolve, reject) => {
      peer2.on('open', resolve);
      peer2.on('error', (e: any) => reject(new Error(`Peer2 error: ${e}`)));
      setTimeout(() => reject(new Error('PeerJS cloud timeout')), 10000);
    });

    expect(peer1Id).toBeTruthy();
    expect(peer2Id).toBeTruthy();
    expect(peer1Id).not.toBe(peer2Id);

    const stream1 = new MediaStream();
    const stream2 = new MediaStream();

    const incomingCallPromise = new Promise<any>((resolve) => {
      peer2.on('call', (call: any) => {
        call.answer(stream2);
        call.on('stream', (remoteStream: any) => resolve({ call, remoteStream }));
      });
    });

    const call = peer1.call(peer2Id, stream1);
    const outgoingStreamPromise = new Promise<any>((resolve) => {
      call.on('stream', (remoteStream: any) => resolve(remoteStream));
    });

    const [incoming, outgoing] = await Promise.all([
      incomingCallPromise,
      outgoingStreamPromise,
    ]);

    expect(incoming.call).toBeTruthy();
    expect(incoming.remoteStream).toBeTruthy();
    expect(outgoing).toBeTruthy();

    call.close();
    peer1.destroy();
    peer2.destroy();
  }, 30000);
});
