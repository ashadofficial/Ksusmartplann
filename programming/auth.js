document.addEventListener("DOMContentLoaded", function () {
  // Password visibility controls
  document.querySelectorAll(".password-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  const client = window.KSU_SUPABASE;
  function requireConfig() {
    if (!client) {
      alert("Supabase is not configured yet. Please add your Supabase URL and publishable/anon key in js/supabase-config.js.");
      return false;
    }
    return true;
  }
  function cacheProfile(profile, authUser) {
    const user = {
      id: authUser?.id || profile.id,
      email: authUser?.email || profile.email || "",
      fullName: profile.full_name || authUser?.user_metadata?.full_name || "Student",
      studentId: profile.student_id || authUser?.user_metadata?.student_id || "",
      mobileNumber: profile.mobile_number || authUser?.user_metadata?.mobile_number || "",
      department: profile.department || authUser?.user_metadata?.department || "",
      academicYear: profile.academic_year || authUser?.user_metadata?.academic_year || "",
      semester: profile.semester || authUser?.user_metadata?.semester || "",
      completedCredits: Number(profile.completed_credits || 0)
    };
    // Compatibility cache for existing app pages. Passwords are never stored here.
    localStorage.setItem("ksuSmartPlanCurrentUser", JSON.stringify(user));
    localStorage.setItem("ksuSmartPlanUsers", JSON.stringify([user]));
    return user;
  }
  async function loadProfile(authUser) {
    const { data, error } = await client.from("student_profiles").select("id, full_name, student_id, mobile_number, department, academic_year, semester, completed_credits, created_at").eq("id", authUser.id).single();
    if (error) throw error;
    return cacheProfile(data, authUser);
  }

  // REGISTER
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!requireConfig()) return;
      const fullName = document.getElementById("fullName").value.trim();
      const studentId = document.getElementById("registerStudentId").value.trim().toLowerCase();
      const email = document.getElementById("registerEmail").value.trim().toLowerCase();
      const mobileNumber = (document.getElementById("mobileNumber")?.value || "").trim().replace(/[-\s]/g, "");
      const department = document.getElementById("department").value;
      const academicYear = document.getElementById("academicYear").value;
      const semester = document.getElementById("semester").value;
      const password = document.getElementById("registerPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const terms = document.getElementById("terms");
      if (!fullName || !studentId || !email || !mobileNumber || !department || !academicYear || !semester || !password || !confirmPassword) return alert("Please fill in all required fields.");
      if (!/^[a-z]\d{10}$/.test(studentId)) return alert("Student ID must be 1 letter followed by 10 digits (example: a2024791122).");
      if (!/^01\d{8,9}$/.test(mobileNumber)) return alert("Please enter a valid Korean mobile number (example: 01012345678).");
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return alert("Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.");
      if (password !== confirmPassword) return alert("Passwords do not match.");
      if (terms && !terms.checked) return alert("Please agree to the Terms & Conditions.");
      const submit = registerForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, student_id: studentId, mobile_number: mobileNumber, department, academic_year: academicYear, semester } }
        });
        if (error) throw error;
        if (data.session && data.user) {
          // Profile row is created by the SQL trigger. Fetch after the trigger completes.
          const profile = await loadProfile(data.user);
          alert("Account created successfully. You are now signed in.");
          window.location.href = "dashboard.html";
        } else {
          alert("Registration started. Please check your email and confirm your account, then sign in.");
          window.location.href = "index.html";
        }
      } catch (error) {
        console.error("Registration error:", error);
        if (String(error.message || "").toLowerCase().includes("student id already")) alert("This Student ID is already registered.");
        else alert(error.message || "Could not create account. Please check your details and Supabase setup.");
      } finally { if (submit) submit.disabled = false; }
    });
  }

  // LOGIN: the login field now accepts the registered email address.
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!requireConfig()) return;
      const email = document.getElementById("studentId").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      if (!email || !password) return alert("Please enter your registered email and password.");
      const submit = loginForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await loadProfile(data.user);
        const remember = document.getElementById("rememberMe");
        if (remember && remember.checked) localStorage.setItem("ksuSmartPlanRememberedStudent", email);
        else localStorage.removeItem("ksuSmartPlanRememberedStudent");
        window.location.href = "dashboard.html";
      } catch (error) {
        console.error("Login error:", error);
        alert(error.message || "Sign in failed. Check your email and password.");
      } finally { if (submit) submit.disabled = false; }
    });
    const remembered = localStorage.getItem("ksuSmartPlanRememberedStudent");
    if (remembered) {
      const input = document.getElementById("studentId");
      const check = document.getElementById("rememberMe");
      if (input) input.value = remembered;
      if (check) check.checked = true;
    }
  }

  // Password recovery page: send a secure reset link to the account email.
  const forgotForm = document.getElementById("forgotPasswordForm");
  if (forgotForm) {
    const studentIdLabel = document.querySelector('label[for="resetStudentId"]');
    const studentIdInput = document.getElementById("resetStudentId");
    const mobileGroup = document.getElementById("resetMobileNumber")?.closest(".form-group");
    const codeGroup = document.getElementById("verificationCode")?.closest(".form-group");
    const newPasswordGroup = document.getElementById("newPassword")?.closest(".form-group");
    const confirmGroup = document.getElementById("resetConfirmPassword")?.closest(".form-group");
    if (studentIdLabel) studentIdLabel.textContent = "Registered Email Address";
    if (studentIdInput) { studentIdInput.type = "email"; studentIdInput.placeholder = "Enter your registered email"; studentIdInput.removeAttribute("pattern"); }
    const sendButton = document.getElementById("sendVerificationCode");
    const recoveryMode = window.location.hash.includes("type=recovery") || new URLSearchParams(window.location.search).get("type") === "recovery";
    [mobileGroup, codeGroup].forEach(el => { if (el) el.style.display = "none"; });
    if (recoveryMode) {
      const emailGroup = studentIdInput?.closest(".form-group");
      if (emailGroup) emailGroup.style.display = "none";
      if (newPasswordGroup) newPasswordGroup.style.display = "block";
      if (confirmGroup) confirmGroup.style.display = "block";
      if (sendButton) sendButton.style.display = "none";
      const submit = forgotForm.querySelector('button[type="submit"]');
      if (submit) submit.textContent = "Update Password";
      forgotForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!requireConfig()) return;
        const password = document.getElementById("newPassword").value;
        const confirm = document.getElementById("resetConfirmPassword").value;
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return alert("Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.");
        if (password !== confirm) return alert("Passwords do not match.");
        const { error } = await client.auth.updateUser({ password });
        if (error) alert(error.message);
        else { alert("Password updated successfully. Please sign in again."); await client.auth.signOut(); window.location.href = "index.html"; }
      });
    } else {
      [newPasswordGroup, confirmGroup].forEach(el => { if (el) el.style.display = "none"; });
      if (sendButton) sendButton.textContent = "Send Password Reset Link";
      if (sendButton) sendButton.addEventListener("click", async function (event) {
        event.preventDefault();
        if (!requireConfig()) return;
        const email = studentIdInput.value.trim().toLowerCase();
        if (!email) return alert("Enter your registered email address.");
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) alert(error.message); else alert("If this email is registered, a password reset link will be sent. Check your inbox.");
      });
      forgotForm.addEventListener("submit", e => e.preventDefault());
    }
  }
});
