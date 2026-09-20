import { useCallback, useEffect, useState } from "react";
import "./Appointments.css";
import DoctorService from "../../services/DoctorService";
import { notify } from "../../components/ToastProvider";
import { getAllLocalAppointments } from "../../utils/clinicalStorage";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [completing, setCompleting] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await DoctorService.getAppointments();
      setAppointments(Array.isArray(data) && data.length > 0 ? data : getAllLocalAppointments());
    } catch (e) {
      console.warn("Unable to fetch appointments from server, showing local data:", e);
      setAppointments(getAllLocalAppointments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (item, status, details = {}) => {
    setUpdating(item.id);
    try {
      await DoctorService.updateAppointmentStatus(item.id, status, details);
      setCompleting(null);
      setCancelling(null);
      await load();
      notify.success(`Appointment ${status.toLowerCase()}.`);
    } catch (e) {
      notify.error(e.response?.data?.message || "Unable to update appointment.");
    } finally {
      setUpdating("");
    }
  };

  const complete = (event) => {
    event.preventDefault();
    if (!notes.trim()) {
      return notify.warning("Add consultation notes before completing the appointment.");
    }
    setStatus(completing, "COMPLETED", { doctorNotes: notes.trim(), followUpDate });
  };

  const cancel = (event) => {
    event.preventDefault();
    if (!cancelReason.trim()) {
      return notify.warning("Add a reason before cancelling the appointment.");
    }
    setStatus(cancelling, "CANCELLED", { cancelReason: cancelReason.trim() });
  };

  return (
    <div className="doctor-appointments">
      <div className="doctor-page-header">
        <h2>Appointments</h2>
        <p>Confirm visits, record notes, and schedule follow-up care.</p>
      </div>

      <div className="appointments-card">
        <div className="appointment-toolbar">
          <h3>Appointment requests</h3>
          <button onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="appointment-empty">Loading appointments...</p>
        ) : appointments.length ? (
          <div className="appointment-table">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Date & time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Follow-up / notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.workerName || `Worker #${item.workerId}`}</strong>
                      <small>Worker #{item.workerCode || item.workerId}</small>
                    </td>
                    <td>
                      {item.appointmentAt ? new Date(item.appointmentAt).toLocaleString() : "-"}
                    </td>
                    <td>{item.reason}</td>
                    <td>
                      <span className={`appointment-status ${String(item.status).toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === "CANCELLED" && item.cancelReason ? (
                        <small style={{ color: "#d92d20" }}>Reason: {item.cancelReason}</small>
                      ) : (
                        <>
                          {item.followUpDate && <small>Follow-up: {item.followUpDate}</small>}
                          {item.doctorNotes && <small>{item.doctorNotes}</small>}
                          {!item.followUpDate && !item.doctorNotes && "-"}
                        </>
                      )}
                    </td>
                    <td>
                      {item.status === "PENDING" ? (
                        <div className="appointment-actions">
                          <button
                            className="confirm-appointment"
                            disabled={updating === item.id}
                            onClick={() => setStatus(item, "CONFIRMED")}
                          >
                            Confirm
                          </button>
                          <button
                            className="cancel-appointment"
                            disabled={updating === item.id}
                            onClick={() => {
                              setCancelling(item);
                              setCancelReason("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : item.status === "CONFIRMED" ? (
                        <button
                          className="complete-appointment"
                          onClick={() => {
                            setCompleting(item);
                            setNotes("");
                            setFollowUpDate("");
                          }}
                        >
                          Complete visit
                        </button>
                      ) : item.status === "COMPLETED" ? (
                        <span className="completed-action">Visit completed</span>
                      ) : (
                        <span>Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="appointment-empty">No appointments found.</p>
        )}
      </div>

      {completing && (
        <div className="appointment-modal">
          <form onSubmit={complete}>
            <h3>Complete appointment</h3>
            <p>
              {completing.workerName} ·{" "}
              {completing.appointmentAt
                ? new Date(completing.appointmentAt).toLocaleString()
                : ""}
            </p>
            <label>
              Doctor notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Consultation summary and care advice"
                required
              />
            </label>
            <label>
              Follow-up date
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </label>
            <div>
              <button type="button" onClick={() => setCompleting(null)}>
                Cancel
              </button>
              <button disabled={updating === completing.id}>Save as completed</button>
            </div>
          </form>
        </div>
      )}

      {cancelling && (
        <div className="appointment-modal">
          <form onSubmit={cancel}>
            <h3>Cancel appointment</h3>
            <p>
              {cancelling.workerName} ·{" "}
              {cancelling.appointmentAt
                ? new Date(cancelling.appointmentAt).toLocaleString()
                : ""}
            </p>
            <label>
              Cancellation reason
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why is this appointment being cancelled?"
                required
              />
            </label>
            <div>
              <button type="button" onClick={() => setCancelling(null)}>
                Back
              </button>
              <button
                className="cancel-appointment-submit"
                disabled={updating === cancelling.id}
                style={{ background: "#d92d20" }}
              >
                Confirm Cancellation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Appointments;
