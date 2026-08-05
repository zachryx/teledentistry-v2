import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import {
  createCall,
  findActiveByAppointment,
  findCallById,
  joinCall,
  updateCall,
} from '../services/calls.service';
import { CALL_STATUS } from '../models/call.model';
import { getSessionManager } from '../chat/session-store';
import { SOCKET_EVENTS } from '../chat/socket-events';
import { HttpError } from '../guards/http-error';
import { successResponse, createCallBody, validateCallBody, joinCallBody } from '../swagger-schemas';

export const callsRoutes = (app: Elysia) =>
  app.group('/api/v1/calls', (app) =>
    app.use(authGuard)
      .post('/', ({ body, user }) => {
        const peerField =
          user.role === 'DOCTOR'
            ? { doctor_peer_id: body.peer_id }
            : { hub_peer_id: body.peer_id };
        return createCall({
          appointment: body.appointment_id,
          host: body.peer_id,
          start_time: new Date(),
          ...peerField,
        } as any).then((call) => ({
          success: true,
          message: 'Call created successfully',
          data: call,
        }));
      }, { body: createCallBody, response: successResponse })
      .post('/validate', ({ body, user }) =>
        findActiveByAppointment(body.appointment_id).then((call) => {
          if (!call) throw new HttpError(400, "Active call session doesn't exist");
          const actor = `${user.role.toLowerCase()}_peer_id`;
          if (!(call as any)[actor]) throw new HttpError(400, 'Failed to validate call');
          const isHost = call.host === (call as any)[actor];
          return updateCall(
            { _id: call._id },
            {
              [actor]: body.peer_id,
              ...(isHost && { host: body.peer_id }),
            },
          ).then((updatedCall) => ({
            success: true,
            message: 'Call validated successfully',
            data: updatedCall,
          }));
        })
      , { body: validateCallBody, response: successResponse })
      .post('/refresh-peer', ({ body, user }) =>
        findActiveByAppointment(body.appointment_id).then((call) => {
          if (!call) throw new HttpError(400, "Active call session doesn't exist");
          const actor = `${user.role.toLowerCase()}_peer_id`;
          return updateCall(
            { _id: call._id },
            {
              [actor]: body.peer_id,
              ...(call.host === (call as any)[actor] && { host: body.peer_id }),
            },
          ).then((updatedCall) => ({
            success: true,
            message: 'Peer ID refreshed successfully',
            data: updatedCall,
          }));
        })
      , { body: validateCallBody, response: successResponse })
      .post('/join', ({ body, user }) =>
        joinCall(body.call_id, body.peer_id, user).then((joinedCall) => {
          if (joinedCall) {
            const sessionManager = getSessionManager();
            if (sessionManager) {
              const otherParticipants = ((joinedCall as any).participants ?? [])
                .map(String)
                .filter((id: string) => id !== String(user.id));
              Promise.allSettled(
                otherParticipants.map((participantId: string) =>
                  sessionManager.emitToUser(participantId, SOCKET_EVENTS.NOTIFICATION, {
                    type: 'call:participant_joined',
                    call: joinedCall,
                    joinedBy: user.id,
                  }),
                ),
              );
            }
          }
          return {
            success: true,
            message: 'Call joined successfully',
            data: joinedCall,
          };
        })
      , { body: joinCallBody, response: successResponse })
      .get('/:appointment', ({ params }) =>
        findActiveByAppointment(params.appointment).then((call) => ({
          success: true,
          message: 'Call fetched successfuly',
          data: call,
        })),
        { response: successResponse },
      )
      .post('/:id/end', ({ params, user }) =>
        findCallById(params.id).then((call) => {
          if (!call) throw new HttpError(404, 'Call not found');
          const actor = `${user.role.toLowerCase()}_peer_id`;
          const isHost = call.host === (call as any)[actor];
          return updateCall(
            { _id: call._id },
            {
              [actor]: null,
              ...(isHost && { status: CALL_STATUS.ENDED, end_time: new Date() }),
            },
          ).then((updatedCall) => {
            const sessionManager = getSessionManager();
            if (sessionManager && updatedCall) {
              const notificationType = isHost ? 'call:ended' : 'call:participant_left';
              const otherParticipants = ((call as any).participants ?? [])
                .map(String)
                .filter((id: string) => id !== String(user.id));
              Promise.allSettled(
                otherParticipants.map((participantId: string) =>
                  sessionManager.emitToUser(participantId, SOCKET_EVENTS.NOTIFICATION, {
                    type: notificationType,
                    call: updatedCall,
                    leftBy: user.id,
                  }),
                ),
              );
            }
            return {
              success: true,
              message: "Call's session ended successfully",
              data: updatedCall,
            };
          });
        }),
        { response: successResponse },
      ),
  );
