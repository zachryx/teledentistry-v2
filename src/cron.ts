import { AppointmentModel, APPOINTMENT_STATUS } from './models/appointment.model';

const INTERVAL_MS = 5 * 60 * 1000;

export function startAppointmentCron() {
  setInterval(async () => {
    try {
      const now = new Date();
      await AppointmentModel.updateMany(
        {
          status: APPOINTMENT_STATUS.PENDING,
          schedule_date: { $lt: now },
        },
        { $set: { status: APPOINTMENT_STATUS.PASSED } },
      );

      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
      await AppointmentModel.updateMany(
        {
          status: APPOINTMENT_STATUS.IN_PROGRESS,
          start_time: { $lt: thirtyMinAgo },
        },
        { $set: { status: APPOINTMENT_STATUS.COMPLETED } },
      );
    } catch (err) {
      console.error('Appointment cron error:', err);
    }
  }, INTERVAL_MS);
}
