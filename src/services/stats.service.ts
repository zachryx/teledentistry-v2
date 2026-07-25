import { PatientModel } from '../models/patient.model';
import { AppointmentModel, APPOINTMENT_STATUS } from '../models/appointment.model';

export async function getDailyStats(hubId: string) {
  const now = new Date();
  now.setDate(now.getDate() - now.getDay());
  now.setHours(0, 0, 0, 0);

  const [totalPatients, newPatients, pendingAppointments, completedAppointments] =
    await Promise.all([
      PatientModel.countDocuments({ hub: hubId }),
      PatientModel.countDocuments({ hub: hubId, created_at: { $gte: now } }),
      AppointmentModel.countDocuments({
        hub: hubId,
        status: APPOINTMENT_STATUS.PENDING,
      }),
      AppointmentModel.countDocuments({
        hub: hubId,
        status: APPOINTMENT_STATUS.COMPLETED,
      }),
    ]);

  return {
    totalPatients,
    newPatients,
    pendingAppointments,
    completedAppointments,
  };
}

