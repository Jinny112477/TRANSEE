require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path'); // Add this at the top with other requires
const bcrypt = require('bcryptjs'); // Add this line
const session = require('express-session'); // Add this line
// const { act } = require('react');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); // <-- ADD THIS LINE

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware should come BEFORE any route that uses req.session
app.use(session({
    secret: 'your-secret-key', // use a strong secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using HTTPS
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use('/src', express.static('src')); // Add this line
app.use('/components', express.static(path.join(__dirname, 'components')));

// Serve Start.html at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'components', 'Start.html'));
});

app.get('/api/users/:email', async (req, res) => {
    const email = req.params.email;
    const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

    if (error) {
        console.log("Error: ", error);
        return res.json({email : 'available'});
    }
    res.json(data);
});

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    // Check if password and confirm-password match
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the 'users' table
    const { data, error } = await supabase
        .from('users')
        .insert([{ email, password: hashedPassword }]);

    if (error) {
        console.error('Error inserting user:', error);
        // return res.status(500).send('Error signing up');
    }

    // Save email to session
    req.session.userEmail = email;

    // res.redirect('/StudentInfo.html');
    res.status(201).json({ success: true, message: 'User signed up successfully', email});

});

app.get('/api/login/:email/:password', async (req, res) => {
    const email = req.params.email;
    const password = req.params.password;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    // Get admin by email
    const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('email_admin', email)
        .single();

    const { data: student, error: studentError } = await supabase
            .from('student_info')
            .select('*')
            .eq('email', email)
            .single();
    
    if (!user && !admin) {
        return res.json({user, admin, error, adminError, student, studentError, passwordMatch: false});
    }

    let passwordMatch = false;
    if (user) {
        passwordMatch = await bcrypt.compare(password, user.password);
    
    } else if (admin) {
        passwordMatch = password === admin.password_admin;
    }

    console.log(passwordMatch);

    req.session.userEmail = email;
        
    res.json({user, admin, error, adminError, student, studentError, passwordMatch})
}); 

app.get('/api/studentInfo', async (req, res) => {

    const { data, error } = await supabase
    .from('student_info')
    .select("*");

    if (error) {
        console.log("Error: ", error);
    }

    res.json(data);
});

app.get('/api/studentInfo/:year', async (req, res) => {

    const academicYear = req.params.year;
    const { data, error } = await supabase
    .from('student_info')
    .select("*")
    .eq('academic_year', academicYear);
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/studentInfo/studentID/:student_id', async (req, res) => {

    const studentId = req.params.student_id;
    const { data, error } = await supabase
    .from('student_info')
    .select("*")
    .eq('student_id', studentId)
    .single();
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/activity', async (req, res) => {

    const { data, error } = await supabase
    .from('add_activity')
    .select("*");

    if (error) {
        console.log("Error: ", error);
    }

    res.json(data);
});


app.post('/api/add_activity', async (req, res) => {

    const {
        name,
        hours,
        provider,
        start_date,
        end_date,
        type,
        location,
        img,
        detail
        } = req.body;

    const info = req.body;
    const { error } = await supabase
    .from('add_activity')
    .insert([
        {act_name: info.name,
        act_hour: info.hours,
        provider_name: info.provider,
        start_date: info.start_date,
        end_date: info.end_date,
        act_type: info.type,
        place: info.location,
        act_img: info.img,
        description: info.detail}
    ])
    .select()
    if (error) {
        console.log("Error: ", error);
    }
    res.json(info)
});

app.get('/api/activity/:id', async (req, res) => {
    const activityId = req.params.id;  
    const { data, error } = await supabase
    .from('add_activity')
    .select("*")
    .eq('activity_id', activityId)
    .single();
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/earliestActivity', async (req, res) => {
    const { data, error } = await supabase
    .from('add_activity')
    .select("*")
    .order('start_date', { ascending: true })
    .limit(1);

    if (error) {
        console.log("Error: ", error);
    }  
    res.json(data);
});

app.post('/add-student', async (req, res) => {

    const { 
        pronouns, 
        full_name, 
        student_id,
        birth_date, 
        email, 
        phone_number, 
        faculty, 
        academic_year, 
        GPAX, 
        img } = req.body;

    const info = req.body;

    const { error } = await supabase
    .from('student_info')
    .insert([
        {pronouns: info.pronouns,
        full_name: info.full_name,
        student_id: info.student_id,
        birth_date: info.birth_date,
        email: info.email,
        phone_number: info.phone_number,
        faculty: info.faculty,
        academic_year: info.academic_year,
        GPAX: info.GPAX,
        img: info.img}
    ])
    .select()

    if (error) {
        console.log("Error: ", error);
    }

    res.json(info)
});

app.put('/edit-student/:email', async (req, res) => {

    const { 
        pronouns, 
        full_name, 
        student_id,
        birth_date, 
        email, 
        phone_number, 
        faculty, 
        academic_year, 
        GPAX, 
        img } = req.body;

    const info = req.body;
    const user_email =  req.params.email;

    const { error } = await supabase
    .from('student_info')
    .update([
        {pronouns: info.pronouns,
        full_name: info.full_name,
        student_id: info.student_id,
        birth_date: info.birth_date,
        email: info.email,
        phone_number: info.phone_number,
        faculty: info.faculty,
        academic_year: info.academic_year,
        GPAX: info.GPAX,
        img: info.img}
    ])
    .eq('email', user_email)
    .select()

    if (error) {
        console.log("Error: ", error);
    }
    res.json(info)
});

app.delete('/delete-student/:email', async (req, res) => {

    const email =  req.params.email;

    const { error } = await supabase
    .from('student_info')
    .delete()
    .eq('email', email)

    if (error) {
        console.log("Error: ", error);
    }

    res.send("Student has been deleted")
});

app.get('/api/user-email', (req, res) => {
    const email = req.session.userEmail || null;
    res.json({ email });
});

const facultyMap = {
    soften: "วิศวกรรมซอฟต์แวร์",
    ebm: "วิศวกรรมโยธาและการบริหารการก่อสร้าง",
    ipen: "วิศวกรรมไฟฟ้าและการจัดการอุตสาหกรรม"
};

app.get('/api/student_info/me', async (req, res) => {
    const email = req.session.userEmail;
    if (!email) return res.status(401).json({ error: 'Not logged in' });

    const { data, error } = await supabase
        .from('student_info')
        .select('*')
        .eq('email', email)
        .single();

    if (error) return res.status(500).json({ error: 'Database error' });

    // Convert faculty code to Thai name
    if (data && data.faculty) {
        data.faculty = facultyMap[data.faculty] || data.faculty;
    }

    res.json(data);
});

//Check student ID exists
app.get("/api/check-student-id/:id", async (req, res) => {
  const studentId = req.params.id;

  const { data, error } = await supabase
    .from("student_info")
    .select("student_id")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ exists: !!data }); // true if found, false if not
});

app.post('/api/add_request', async (req, res) => {
  const { activity_id, std_id, status = 'pending', role, img } = req.body;
  if (!activity_id || !std_id) {
    return res.status(400).json({ error: 'Missing activity_id or std_id' });
  }

  try {
    // check existing registration for this student + activity
    const { data: existing, error: checkErr } = await supabase
      .from('reg_act')
      .select('*')
      .eq('student_id', std_id)
      .eq('act_id', activity_id)
      .maybeSingle();

    if (checkErr) throw checkErr;

    if (existing) {
      // update existing row instead of inserting a duplicate
      const { data: updated, error: updErr } = await supabase
        .from('reg_act')
        .update({ status, role, image: img })
        .eq('id', existing.id)
        .select()
        .maybeSingle();

      if (updErr) throw updErr;
      return res.json({ message: 'Request updated', data: updated });
    }

    // insert new request
    const { data: inserted, error: insertErr } = await supabase
      .from('reg_act')
      .insert([{ act_id: activity_id, student_id: std_id, status, role, image: img }])
      .select();

    if (insertErr) throw insertErr;
    res.json({ message: 'Request created', data: inserted });
  } catch (err) {
    console.error('add_request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/approved_request/:std_id', async (req, res) => {
    const studentId = req.params.std_id;
    const { data, error } = await supabase
    .from('reg_act')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'approved');
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/approved_request/with_name/:std_id', async (req, res) => {
    const studentId = req.params.std_id;
    const { data, error } = await supabase
    .from('reg_act')
    .select('student_id, role, add_activity(act_name, start_date)')
    .eq('student_id', studentId)
    .eq('status', 'approved');
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/requests/:std_id', async (req, res) => {

    const studentId = req.params.std_id;

    const { data, error } = await supabase
    .from('reg_act')
    .select('*')
    .eq('student_id', studentId);
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/requests/:act_id', async (req, res) => {

    const activityId = req.params.act_id;

    const { data, error } = await supabase
    .from('reg_act')
    .select('*')
    .eq('act_id', activityId);
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/request_status', async (req, res) => {


    const { data, error } = await supabase
    .from('add_activity')
    .select('activity_id, act_name, start_date, provider_name, reg_act(student_id, status, role)')
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/name_list/:id', async (req, res) => {

    const activityId = req.params.id;
    // activityId = 2;

    const { data, error } = await supabase
    .from('reg_act')
    .select('student_info(full_name), id, student_id, status, add_activity(act_name)')
    .eq('act_id', activityId);
    if (error) {
        console.log("Error: ", error);
    }
    res.json(data);
});

app.get('/api/request/info/:id', async (req, res) => {

    const req_id = req.params.id;

    const { data, error } = await supabase
    .from('reg_act')
    .select('student_info(full_name), add_activity(*), student_id, role')
    .eq("id", req_id)
    if (error) {
        console.log("Error: ", error);
    }

    res.json(data);
});

app.get('/api/all_requests', async (req, res) => {

    const { data, error } = await supabase
    .from('reg_act')
    .select('*');
    if (error) {
        console.log("Error: ", error);
    }

    res.json(data);
});

app.put('/api/update_status/:id', async (req, res) => {

    const req_id = req.params.id;

    const { error } = await supabase
    .from('reg_act')
    .update([
        {"status" : req.body.status}
    ])
    .eq("id", req_id)
    .select()

    if (error) {
        console.log("Error: " + error);
    }
    // res.json(status);
});

app.get('/api/approve_page/:id', async (req, res) => {

    const req_id = req.params.id;

    const { data, error } = await supabase
    .from('reg_act')
    .select('add_activity(act_name, act_hour, provider_name, act_type, start_date, place, description, act_img), student_id, role, image, student_info(full_name)')
    .eq('id', req_id)
    .single()
    if (error) {
        console.log("Error: ", error);

    }
    res.json(data);
});

// Handle repeated activity registration
app.post('/api/register_activity', async (req, res) => {
  const { student_id, act_id } = req.body;

  if (!student_id || !act_id) {
    return res.status(400).json({ error: 'Missing student_id or act_id' });
  }

  try {
    // Step 1: Check if record already exists
    const { data: existing, error: checkError } = await supabase
      .from('reg_act')
      .select('*')
      .eq('student_id', student_id)
      .eq('act_id', act_id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return res.status(400).json({ error: 'You have already registered for this activity.' });
    }

    // Step 2: Insert new registration
    const { error: insertError } = await supabase
      .from('reg_act')
      .insert([{ student_id, act_id }]);

    if (insertError) throw insertError;

    res.status(200).json({ message: 'Registration successful.' });
  } catch (error) {
    console.error('Error registering activity:', error.message);
    res.status(500).json({ error: 'Failed to register for activity.' });
  }
});

// Example in Express
app.post("/api/student/selected-activities", (req, res) => {
  if (!req.session) return res.status(500).send("Session not initialized");
  req.session.selectedActIds = req.body.selectedActIds || [];
  res.json({ success: true });
});

app.get("/api/student/selected-activities", (req, res) => {
  res.json(req.session.selectedActIds || []);
});


// Handle fetching roles for selected activities
app.post('/api/student/roles-for-selected', async (req, res) => {
  const email = req.session.userEmail;
  const selectedActIds = req.body.selectedActIds;

  if (!email) return res.status(401).json({ error: 'Not logged in' });
  if (!Array.isArray(selectedActIds) || selectedActIds.length === 0) {
    return res.status(400).json({ error: 'No activity IDs provided' });
  }

  try {
    const { data: student, error: studentErr } = await supabase
      .from('student_info')
      .select('student_id')
      .eq('email', email)
      .single();

    if (studentErr || !student) return res.status(404).json({ error: 'Student not found' });

    const { data, error } = await supabase
      .from('reg_act')
      .select('act_id, role')
      .eq('student_id', student.student_id)
      .in('act_id', selectedActIds.map(String));

    if (error) return res.status(500).json({ error: 'Failed to fetch roles' });

    const roleMap = {};
    data.forEach(r => { roleMap[String(r.act_id)] = r.role; });

    res.json(roleMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*');

    if (error) {
      console.error('Supabase error /api/activities:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(data);
  } catch (err) {
    console.error('Unexpected error /api/activities:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});