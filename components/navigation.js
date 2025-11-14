document.addEventListener("DOMContentLoaded", async () => {
  const supabaseUrl = "https://zaiqcplnlbqssdjdkfhj.supabase.co";
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXFjcGxubGJxc3NkamRrZmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA2MDAxNywiZXhwIjoyMDcxMjgwNTE3fQ.BNn44nvTASiqzhcZSOcrg5RYBpXoI-WcLYjc5n-vX7E";
  const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseAnonKey
  );

  let studentId = null;

  // 🔹 Fetch current user info from backend session
  try {
    const meResp = await fetch("/api/student_info/me");
    if (meResp.ok) {
      const meData = await meResp.json();
      studentId = meData.student_id || null;
    }
  } catch (err) {
    console.error("Error fetching student info:", err);
  }

  // 🏠 Home button
  const homeIcon = document.getElementById("homeIcon");
  if (homeIcon) {
    homeIcon.addEventListener("click", () => {
      const dest = studentId
        ? `HomePage.html?id=${encodeURIComponent(studentId)}`
        : "HomePage.html";
      window.location.href = dest;
    });
  }

  let academicYear = null;

  // 🔹 Fetch current academic year from backend session or context
  try {
    const meResp = await fetch("/api/student_info/academic_year");
    if (meResp.ok) {
      const meData = await meResp.json();
      academicYear = meData.academic_year || null;
    }
  } catch (err) {
    console.error("Error fetching academic year:", err);
  }

  // Back button logic
  // 🔙 Back button behavior
  const backBtnYear = document.getElementById("backButtonYear");
  if (backBtnYear) {
    backBtnYear.addEventListener("click", () => {
      if (document.referrer) {
        // Go back if there's a previous page
        window.history.back();
      } else if (academicYear) {
        // Redirect to activity-specific name list
        window.location.href = `std_list.html?year=${encodeURIComponent(
          academicYear
        )}`;
      } else {
        // Fallback to admin page if nothing else
        window.location.href = "std_list.html";
      }
    });
  }

  let activityId = null;

  // 🔹 Fetch activity id from backend session or context
  try {
    const meResp = await fetch("/api/reg_act/act_id");
    if (meResp.ok) {
      const meData = await meResp.json();
      activityId = meData.act_id || null;
    } else {
      console.warn("Failed to fetch activity ID, status:", meResp.status);
    }
  } catch (err) {
    console.error("Error fetching activity id:", err);
  }

  // 🔙 Back button behavior
  const backBtn = document.getElementById("backButton");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (document.referrer) {
        // Go back if there's a previous page
        window.history.back();
      } else if (activityId) {
        // Redirect to activity-specific name list
        window.location.href = `name_list.html?act_id=${encodeURIComponent(
          activityId
        )}`;
      } else {
        // Fallback to admin page if nothing else
        window.location.href = "name_list.html";
      }
    });
  }
});
