import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const surveyorListTrend = new Trend('surveyor_list_duration');
const availabilityTrend = new Trend('availability_duration');
const createAppointmentTrend = new Trend('create_appointment_duration');
const activityLogTrend = new Trend('activity_log_duration');

// Configuration
const API_BASE = __ENV.API_BASE || 'http://localhost:8080/api';

// Test configurations based on TEST_TYPE
const testConfigs = {
  smoke: {
    stages: [
      { duration: '1m', target: 5 },   // Ramp up to 5 users
      { duration: '1m', target: 5 },   // Stay at 5 users
      { duration: '30s', target: 0 },  // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
      errors: ['rate<0.01'],              // Error rate under 1%
    },
  },
  load: {
    stages: [
      { duration: '2m', target: 20 },   // Ramp up to 20 users
      { duration: '5m', target: 20 },   // Stay at 20 users
      { duration: '2m', target: 50 },   // Ramp up to 50 users
      { duration: '5m', target: 50 },   // Stay at 50 users
      { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000', 'p(99)<2000'],
      errors: ['rate<0.05'],
    },
  },
  stress: {
    stages: [
      { duration: '2m', target: 50 },   // Ramp up
      { duration: '5m', target: 50 },   // Stay
      { duration: '2m', target: 100 },  // Push to 100 users
      { duration: '5m', target: 100 },  // Stay at 100
      { duration: '2m', target: 150 },  // Push to 150 users
      { duration: '5m', target: 150 },  // Stay at 150
      { duration: '5m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      errors: ['rate<0.10'],
    },
  },
  spike: {
    stages: [
      { duration: '1m', target: 10 },   // Baseline
      { duration: '30s', target: 200 }, // Spike to 200 users
      { duration: '1m', target: 200 },  // Stay at spike
      { duration: '30s', target: 10 },  // Drop back
      { duration: '2m', target: 10 },   // Recovery
      { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<3000'],
      errors: ['rate<0.15'],
    },
  },
  soak: {
    stages: [
      { duration: '5m', target: 30 },   // Ramp up
      { duration: '30m', target: 30 },  // Stay at 30 users for 30 min
      { duration: '5m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000'],
      errors: ['rate<0.02'],
    },
  },
};

const testType = __ENV.TEST_TYPE || 'smoke';
const config = testConfigs[testType];

export const options = {
  stages: config.stages,
  thresholds: {
    ...config.thresholds,
    'surveyor_list_duration': ['p(95)<500'],
    'availability_duration': ['p(95)<800'],
    'create_appointment_duration': ['p(95)<1000'],
    'activity_log_duration': ['p(95)<600'],
  },
};

// Helper function to get date range
function getDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  return { from, to };
}

// Helper function to get future datetime for appointments
function getFutureDateTime(daysAhead = 1, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // ============ SURVEYOR API TESTS ============
  group('Surveyor API', () => {
    // GET /surveyors - List all surveyors
    const surveyorRes = http.get(`${API_BASE}/surveyors`);
    surveyorListTrend.add(surveyorRes.timings.duration);

    const surveyorCheck = check(surveyorRes, {
      'surveyors: status is 200': (r) => r.status === 200,
      'surveyors: response is array': (r) => Array.isArray(JSON.parse(r.body)),
      'surveyors: response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!surveyorCheck);

    // GET /surveyors?type=INTERNAL - Filter by type
    const internalRes = http.get(`${API_BASE}/surveyors?type=INTERNAL`);
    check(internalRes, {
      'internal surveyors: status is 200': (r) => r.status === 200,
    });

    // GET /surveyors?currentStatus=AVAILABLE - Filter by status
    const availableRes = http.get(`${API_BASE}/surveyors?currentStatus=AVAILABLE`);
    check(availableRes, {
      'available surveyors: status is 200': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  // ============ AVAILABILITY API TESTS ============
  group('Availability API', () => {
    const { from, to } = getDateRange();

    // GET /availability - List availability for date range
    const availRes = http.get(`${API_BASE}/availability?from=${from}&to=${to}`);
    availabilityTrend.add(availRes.timings.duration);

    const availCheck = check(availRes, {
      'availability: status is 200': (r) => r.status === 200,
      'availability: response is array': (r) => Array.isArray(JSON.parse(r.body)),
      'availability: response time < 800ms': (r) => r.timings.duration < 800,
    });
    errorRate.add(!availCheck);

    // GET /availability with surveyorId filter
    const surveyorAvailRes = http.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=1`);
    check(surveyorAvailRes, {
      'surveyor availability: status is 200': (r) => r.status === 200,
    });

    // GET /availability with multiple surveyorIds
    const multiSurveyorRes = http.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorIds=1,2,3`);
    check(multiSurveyorRes, {
      'multi-surveyor availability: status is 200': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  // ============ APPOINTMENT CREATION (Write Test) ============
  group('Appointment Creation', () => {
    const startTime = getFutureDateTime(Math.floor(Math.random() * 7) + 1, 9 + Math.floor(Math.random() * 8));
    const endTime = new Date(new Date(startTime).getTime() + 3600000).toISOString();
    const surveyorId = Math.floor(Math.random() * 5) + 1;

    const payload = JSON.stringify({
      surveyorId: surveyorId,
      blocks: [{
        startTime: startTime,
        endTime: endTime,
        state: 'BUSY',
        title: `Load Test Appointment ${Date.now()}`,
        description: 'Created by k6 load test'
      }]
    });

    const createRes = http.post(`${API_BASE}/mobile/availability`, payload, { headers });
    createAppointmentTrend.add(createRes.timings.duration);

    const createCheck = check(createRes, {
      'create appointment: status is 200': (r) => r.status === 200,
      'create appointment: ok is true': (r) => {
        try {
          return JSON.parse(r.body).ok === true;
        } catch {
          return false;
        }
      },
      'create appointment: response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(!createCheck);

    sleep(0.3);
  });

  // ============ ACTIVITY LOG API TESTS ============
  group('Activity Log API', () => {
    // GET /activity/recent - Recent activity
    const activityRes = http.get(`${API_BASE}/activity/recent?hours=24&limit=50`);
    activityLogTrend.add(activityRes.timings.duration);

    const activityCheck = check(activityRes, {
      'activity log: status is 200': (r) => r.status === 200,
      'activity log: response is array': (r) => Array.isArray(JSON.parse(r.body)),
      'activity log: response time < 600ms': (r) => r.timings.duration < 600,
    });
    errorRate.add(!activityCheck);

    // GET /activity with filters
    const filteredActivityRes = http.get(`${API_BASE}/activity?hoursBack=24&limit=100`);
    check(filteredActivityRes, {
      'filtered activity: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  // ============ NOTIFICATION API TESTS ============
  group('Notification API', () => {
    // GET /notifications/history
    const historyRes = http.get(`${API_BASE}/notifications/history?limit=50`);
    check(historyRes, {
      'notification history: status is 200': (r) => r.status === 200,
      'notification history: response time < 500ms': (r) => r.timings.duration < 500,
    });

    // GET /notifications/stats
    const statsRes = http.get(`${API_BASE}/notifications/stats?hours=24`);
    check(statsRes, {
      'notification stats: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  // ============ MOBILE API TESTS ============
  group('Mobile API', () => {
    // GET /mobile/appointments/{surveyorId}
    const surveyorId = Math.floor(Math.random() * 5) + 1;
    const appointmentsRes = http.get(`${API_BASE}/mobile/appointments/${surveyorId}?upcoming=true`);
    check(appointmentsRes, {
      'mobile appointments: status is 200': (r) => r.status === 200,
      'mobile appointments: response time < 500ms': (r) => r.timings.duration < 500,
    });

    // POST /mobile/status - Update surveyor status
    const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];
    const statusPayload = JSON.stringify({
      surveyorId: surveyorId,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    });

    const statusRes = http.post(`${API_BASE}/mobile/status`, statusPayload, { headers });
    check(statusRes, {
      'status update: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  // ============ DISPATCHER API TESTS ============
  group('Dispatcher API', () => {
    // GET /dispatcher/status - Check SSE connection count
    const dispatcherStatusRes = http.get(`${API_BASE}/dispatcher/status`);
    check(dispatcherStatusRes, {
      'dispatcher status: status is 200': (r) => r.status === 200,
    });

    sleep(0.2);
  });

  // Random think time between iterations
  sleep(Math.random() * 2 + 1);
}

// Summary handler for custom reporting
export function handleSummary(data) {
  const summary = {
    testType: testType,
    timestamp: new Date().toISOString(),
    metrics: {
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_duration_p95: data.metrics.http_req_duration?.values['p(95)'] || 0,
      http_req_duration_p99: data.metrics.http_req_duration?.values['p(99)'] || 0,
      http_req_failed: data.metrics.http_req_failed?.values?.rate || 0,
      errors: data.metrics.errors?.values?.rate || 0,
      vus_max: data.metrics.vus_max?.values?.max || 0,
    },
    customMetrics: {
      surveyor_list_p95: data.metrics.surveyor_list_duration?.values['p(95)'] || 0,
      availability_p95: data.metrics.availability_duration?.values['p(95)'] || 0,
      create_appointment_p95: data.metrics.create_appointment_duration?.values['p(95)'] || 0,
      activity_log_p95: data.metrics.activity_log_duration?.values['p(95)'] || 0,
    },
  };

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'results/summary.json': JSON.stringify(summary, null, 2),
  };
}

// Simple text summary generator
function textSummary(data, opts) {
  const lines = [
    '',
    '========================================',
    `  K6 Load Test Results - ${testType.toUpperCase()}`,
    '========================================',
    '',
    `  Total Requests:     ${data.metrics.http_reqs?.values?.count || 0}`,
    `  Failed Requests:    ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`,
    `  Error Rate:         ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%`,
    '',
    '  Response Times:',
    `    p(50):  ${(data.metrics.http_req_duration?.values['p(50)'] || 0).toFixed(2)}ms`,
    `    p(95):  ${(data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`,
    `    p(99):  ${(data.metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms`,
    '',
    '  Custom Metrics (p95):',
    `    Surveyor List:      ${(data.metrics.surveyor_list_duration?.values['p(95)'] || 0).toFixed(2)}ms`,
    `    Availability:       ${(data.metrics.availability_duration?.values['p(95)'] || 0).toFixed(2)}ms`,
    `    Create Appointment: ${(data.metrics.create_appointment_duration?.values['p(95)'] || 0).toFixed(2)}ms`,
    `    Activity Log:       ${(data.metrics.activity_log_duration?.values['p(95)'] || 0).toFixed(2)}ms`,
    '',
    '========================================',
    '',
  ];
  return lines.join('\n');
}
