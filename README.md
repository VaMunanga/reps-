# REPS Student Club Website

REPS is a responsive, multi-page student-club MVP for Harare Institute of Technology. The current release uses semantic HTML, authored CSS, vanilla JavaScript modules, a small PHP endpoint, and Neon PostgreSQL.

The release includes:

- a responsive cobalt atmospheric-console design based on `atmospheric-data-console-DESIGN.md`;
- a reliable focus timer with versioned local progress;
- truthful proposed-discussion browsing and local expressions of interest;
- an accessible native-dialog identity gallery;
- progressively enhanced membership submission through PHP and Neon;
- locally hosted fonts and motion that respects reduced-motion preferences.

## Run and test

Requirements: Node.js 20+, npm, and PHP 8.2+ for local checks. A deployed PHP runtime also needs PDO PostgreSQL.

```powershell
npm install
npm test
& 'C:\xampp\php\php.exe' tests/php/join-validation.php
& 'C:\xampp\php\php.exe' -S 127.0.0.1:8765
```

Open `http://127.0.0.1:8765/index.php`. Local XAMPP installations without `pdo_pgsql` can render and validate the app but cannot submit to Neon. See [docs/deployment.md](docs/deployment.md) for database migration, environment, deployment, rollback, and verification instructions.

## Project documentation

The implementation specification and plan are in `docs/superpowers/`. The original academic project-management plan is retained below for coursework context.

---

REPS STUDENT CLUB WEBSITE
MVP Project Documentation and Project Management Plan
Project Name: REPS Student Productivity and Collaboration Club Website
Project Type: Semester Mini Project
Primary Module: ICS 2102 – Web Development
Supporting Module Principles: Software Project Management
Project Duration: 6 Days
Project Owner / Developer: Takudzwa Munanga
Target Institution: Harare Institute of Technology
Project Status: MVP Development

1. PROJECT OVERVIEW
REPS is a proposed HIT student productivity and collaboration club designed for students who want to use their time intentionally, develop consistent work habits, collaborate with like-minded students and pursue excellence through repeated focused action.
The club is based on the philosophy:
Steward your time. Put in the reps. Pursue excellence.
The REPS website will serve two purposes:
Provide information about the REPS student club.
Provide simple productivity and collaboration tools that demonstrate the concepts covered in ICS 2102 Web Development.
The project will remain intentionally small enough to complete within six days while still demonstrating HTML, CSS, JavaScript, arrays, objects, events, forms, PHP and deployment.

2. PROBLEM STATEMENT
Many university students want to improve academically and professionally but struggle with:
inconsistent study habits;
poor use of available time;
lack of accountability;
difficulty finding productive peers;
missing academic or coding discussions happening around campus;
excessive planning without enough focused action;
difficulty tracking focused work.
At the same time, students who are willing to work often lack a simple platform for discovering other students who want to study, code, build projects or participate in challenges.
REPS seeks to create a student community that encourages deliberate work, repeated practice, collaboration and better stewardship of time.

3. PROJECT VISION
To develop a student community in which HIT students intentionally steward their time, consistently pursue excellence and help one another transform potential into meaningful action.

4. PROJECT MISSION
To provide HIT students with simple systems, focused spaces and collaborative opportunities that encourage consistent studying, coding, building, discussion and reflection.

5. CLUB PHILOSOPHY
REPS is guided by the principle:
We believe time is a resource entrusted to us; therefore, we should intentionally and deliberately use it for good work rather than drift through university.
The club promotes action rather than merely appearing busy.
The website will incorporate the Atomic Habits concept of motion versus action.
Planning, researching and preparing may be useful, but they do not necessarily produce results. REPS therefore encourages members to convert intention into focused action.
The platform will measure observable behaviours such as:
focused minutes;
completed work sessions;
progress towards daily goals;
progress towards weekly goals.
It will deliberately avoid creating an artificial “productivity score”.

6. PROJECT OBJECTIVES
The project shall:
Develop a responsive student club website containing at least five interconnected pages.
Provide information about REPS, including its vision, mission, objectives and proposed leadership structure.
Implement a functional focus timer using JavaScript.
Allow students to discover and filter study, coding, project and challenge discussions.
Allow students to indicate interest in joining available discussions using an “I'm in” function.
Provide a membership/contact form with JavaScript validation.
Process submitted membership information using PHP.
Demonstrate JavaScript arrays, objects, loops, functions, events and conditional statements.
Store selected browser-side data using localStorage.
Deploy the completed website on a publicly accessible PHP-compatible hosting platform.
Produce a working MVP within six days without introducing unnecessary scope.

7. PROJECT SUCCESS CRITERIA
The semester MVP will be considered successful if:
all six pages are accessible through working navigation;
the website is responsive on desktop and mobile;
the focus timer starts, pauses, resumes and stops correctly;
completed focus time is recorded correctly;
daily and weekly progress can be displayed;
discussions are generated using JavaScript data;
discussions can be filtered by category;
the “I'm in” feature updates attendance correctly;
discussion capacity cannot exceed 15;
the Join form validates user input;
PHP successfully processes form submissions;
all required ICS 2102 concepts can be demonstrated;
the final application is hosted online;
the public URL works from another device;
no critical errors remain at submission time.

8. TARGET USERS
Primary Users
HIT students interested in:
productivity;
focused study;
coding;
academic discussions;
collaborative projects;
coding challenges;
personal improvement;
meeting serious and productive peers.
The club is open to students from any HIT programme.

9. MVP SCOPE
9.1 In Scope
The semester MVP shall include:
Club Information
Home page
About page
vision
mission
objectives
club philosophy
committee structure
club weekly rhythm
Productivity Features
task name;
task category;
configurable focus duration;
configurable break duration;
start timer;
pause timer;
resume timer;
stop timer;
completed session count;
focused minutes;
daily focus goal;
weekly focus goal;
progress indicators;
localStorage persistence.
Discussion Features
Each discussion may contain:
topic;
category;
module;
department;
year;
location;
date;
time;
host;
capacity;
participant count;
status.
Categories:
Study
Coding
Projects
Challenges
Interaction:
filter discussions;
click I'm in;
increment participant count;
prevent attendance above capacity;
maximum host-defined capacity of 15;
mark full discussions as FULL.
Membership
Membership form containing:
full name;
email;
optional telephone number;
programme/department;
academic year;
interests;
main goal;
preferred working time;
message.
Technical Features
HTML
CSS
JavaScript
DOM manipulation
arrays
objects
loops
functions
conditional statements
events
localStorage
PHP form handling
optional MySQL integration if schedule permits
public deployment

10. OUT OF SCOPE
The following shall not be developed during the six-day MVP:
user accounts;
authentication;
cloud profiles;
real-time messaging;
synchronized group Pomodoro rooms;
notifications;
leaderboards;
gamification achievements;
friend system;
advanced charts;
calendar integration;
mobile application;
cloud synchronization of timer statistics;
member-created discussions through authenticated accounts;
advanced recommendation algorithms.
These features may be considered for future versions.

11. FUTURE PRODUCT VISION
Future versions of REPS may include:
member accounts;
synchronized focus rooms;
student-created discussions;
discussion reviews;
notifications;
study partner matching;
project team matching;
productivity history;
analytics;
group focus statistics;
project collaboration;
startup team formation;
mobile application;
institutional integration.
These are recorded as future opportunities and are not part of the semester MVP.

12. WEBSITE INFORMATION ARCHITECTURE
The application will contain six main pages.
12.1 Home
Purpose:
Introduce REPS and communicate its purpose immediately.
Content:
logo/name;
slogan;
hero section;
club introduction;
stewardship philosophy;
Focus → Study → Discuss → Build → Reflect;
upcoming discussions;
main calls to action;
Join REPS section.

12.2 About
Purpose:
Explain the identity and purpose of the organisation.
Content:
story;
vision;
mission;
objectives;
philosophy;
proposed committee;
weekly operating rhythm.
Proposed committee:
Founder / Coordinator – Takudzwa Munanga
Community Lead – Open
Events Lead – Open
Technical Lead – Open

12.3 Focus
Purpose:
Help members convert intentions into actual focused work.
Functions:
enter task;
select category;
select focus duration;
select break duration;
set goals;
start timer;
pause;
resume;
stop;
complete focus block;
record focus minutes;
display repetitions;
show daily progress;
show weekly progress.

12.4 Discussions
Purpose:
Allow students to discover useful campus study and collaboration opportunities.
Functions:
display discussions from JavaScript data;
filter by category;
show date/time/location;
show participant numbers;
show capacity;
allow user to click I'm in;
prevent joining full discussions.

12.5 Gallery
Purpose:
Communicate the desired REPS culture visually.
Gallery themes may include:
focused study;
coding;
group discussions;
whiteboard sessions;
challenges;
projects;
collaboration.
Images must not falsely imply that fictional activities have already occurred.

12.6 Join
Purpose:
Allow interested students to express interest in joining REPS or contacting the club.
The form shall use:
HTML form controls;
JavaScript validation;
PHP processing;
optional MySQL storage.

13. FUNCTIONAL REQUIREMENTS
FR-01 Navigation
The user shall be able to navigate between all pages using a consistent navigation bar.
FR-02 Focus Timer
The user shall be able to configure and run a focus timer.
FR-03 Pause/Resume
The user shall be able to pause and resume an active focus session.
FR-04 Session Completion
The system shall record completed focus sessions.
FR-05 Focus Statistics
The system shall display:
focused minutes;
completed reps;
daily goal progress;
weekly goal progress.
FR-06 Discussion Display
The system shall display available discussions.
FR-07 Discussion Filtering
The user shall be able to filter discussions by category.
FR-08 Discussion Joining
The user shall be able to indicate participation by clicking I'm in.
FR-09 Capacity
A discussion shall not exceed its host-defined capacity.
Maximum capacity shall be 15 students.
FR-10 Membership Form
Interested students shall be able to submit their details.
FR-11 Form Validation
Required fields shall be validated before submission.
FR-12 Server-Side Processing
PHP shall process submitted membership information.
FR-13 Persistent Browser Data
Focus statistics and selected discussion participation should remain available after page refresh using localStorage.

14. NON-FUNCTIONAL REQUIREMENTS
Usability
The website should be simple enough for a first-time visitor to understand without instructions.
Performance
Pages should load quickly and avoid unnecessary libraries.
Maintainability
HTML, CSS, JavaScript and PHP should be organised into separate files where appropriate.
Responsiveness
The interface should work on:
desktop;
tablet;
mobile.
Accessibility
The system should use:
semantic HTML;
labels;
alt text;
readable contrast;
keyboard-friendly controls where possible.
Reliability
Timer and form functions should behave consistently without page crashes.
Simplicity
The MVP should minimise unnecessary technical complexity.

15. DESIGN PRINCIPLES
The website will follow these visual principles:
minimalism;
clarity;
generous spacing;
energetic but controlled visual identity;
strong typography;
visible calls to action;
simple navigation;
responsive layout;
reusable UI components;
consistency.
Desired emotional response:
“I came here to work.”
The interface should motivate action without creating visual distraction.

16. PROJECT CHARTER
16.1 Project Title
REPS Student Productivity and Collaboration Club Website
16.2 Project Sponsor
Academic project undertaken for ICS 2102 Web Development.
16.3 Project Manager
Takudzwa Munanga
16.4 Project Developer
Takudzwa Munanga
16.5 Project Purpose
To design, develop and deploy a student club website that demonstrates concepts taught in ICS 2102 while creating the foundation of a potentially real HIT student productivity and collaboration club.
16.6 Business / Academic Need
The project is necessary to satisfy semester assessment requirements while demonstrating applied knowledge in:
HTML;
CSS;
JavaScript;
arrays;
objects;
events;
forms;
PHP;
deployment.
It additionally provides a reusable foundation for a possible future REPS organisation.
16.7 High-Level Deliverables
Project documentation
Six-page responsive website
Focus timer
Focus statistics
Discussion directory
Discussion filter
“I'm in” interaction
Gallery
Join form
PHP processing
Optional database
Hosted production website
Tested submission URL
16.8 Project Constraints
Six-day development period
Single developer
Beginner-level JavaScript knowledge
Beginner-level PHP knowledge
Limited deployment experience
Academic requirements must be clearly demonstrated
Scope must remain small
16.9 Assumptions
Internet access will be available for deployment.
A PHP-compatible hosting service can be obtained.
Development will take place using VS Code.
Git and GitHub will be used for version control.
Example discussion data may be used during the MVP.
MySQL integration is optional unless time permits.
16.10 Key Risks
learning JavaScript while simultaneously building;
learning PHP late in the project;
deployment configuration difficulties;
timer logic defects;
scope creep;
insufficient testing;
over-investment in aesthetics;
database work consuming time needed for essential requirements.
16.11 Project Approval Criteria
The project shall be considered ready for submission when:
mandatory requirements are implemented;
all major functions work;
the public URL is available;
the project has undergone final testing;
the developer can explain the implementation.

17. PROJECT MANAGEMENT APPROACH
A lightweight iterative approach will be used.
The project will apply principles of Software Project Management including:
scope management;
decomposition;
scheduling;
risk management;
quality management;
change control;
prioritisation;
progress monitoring;
milestone tracking;
configuration management;
lessons learned.
Because the project lasts only six days, excessive documentation and ceremony will be avoided.
The guiding principle is:
Plan enough to reduce uncertainty, then execute and review continuously.

18. PROJECT BASELINE
Three baselines shall guide project control.
Scope Baseline
Defined by:
MVP requirements;
PBS;
WBS;
out-of-scope list.
Schedule Baseline
Defined by the six-day activity plan.
Quality Baseline
Defined by the acceptance criteria and testing checklist.
Any proposed change should be evaluated against these three baselines.

19. PRIORITISATION
Requirements will use a simplified MoSCoW prioritisation method.
MUST HAVE
six interconnected pages;
navigation;
responsive CSS;
Focus timer;
start/pause/resume/stop;
JavaScript array;
JavaScript objects;
loops;
functions;
events;
discussion filtering;
I'm in interaction;
Join form;
form validation;
PHP processing;
public hosting.
SHOULD HAVE
localStorage;
daily goal;
weekly goal;
focus progress bars;
discussion capacity;
polished mobile layout;
gallery interaction.
COULD HAVE
MySQL membership storage;
modal image gallery;
additional animations;
more detailed session history.
WILL NOT HAVE IN THIS MVP
accounts;
messaging;
cloud synchronization;
leaderboards;
shared live focus rooms;
mobile app.

20. PRODUCT BREAKDOWN STRUCTURE — PBS
The PBS defines what the project must produce.
REPS WEBSITE MVP
│
├── 1. Project Management Deliverables
│   ├── Project Charter
│   ├── MVP Scope
│   ├── PBS
│   ├── WBS
│   ├── Activity Plan
│   ├── Risk Register
│   └── Testing Checklist
│
├── 2. Website Foundation
│   ├── Project Folder
│   ├── Shared Navigation
│   ├── Shared Footer
│   ├── CSS Design System
│   └── Responsive Layout
│
├── 3. Home Page
│   ├── Hero
│   ├── Club Introduction
│   ├── Philosophy
│   ├── Weekly Rhythm
│   ├── Upcoming Discussions
│   └── CTA
│
├── 4. About Page
│   ├── Vision
│   ├── Mission
│   ├── Objectives
│   ├── Philosophy
│   └── Committee
│
├── 5. Focus Module
│   ├── Task Input
│   ├── Category
│   ├── Focus Duration
│   ├── Break Duration
│   ├── Timer Display
│   ├── Start
│   ├── Pause
│   ├── Resume
│   ├── Stop
│   ├── Session Counter
│   ├── Daily Goal
│   ├── Weekly Goal
│   ├── Focus Minutes
│   └── localStorage
│
├── 6. Discussion Module
│   ├── Discussion Array
│   ├── Discussion Objects
│   ├── Discussion Cards
│   ├── Filters
│   ├── I'm In Button
│   ├── Participant Counter
│   ├── Capacity Logic
│   └── Status Display
│
├── 7. Gallery
│   ├── Images
│   ├── Captions
│   └── Gallery Interaction
│
├── 8. Membership Module
│   ├── Join Form
│   ├── JavaScript Validation
│   ├── PHP Processor
│   ├── Response Page
│   └── Optional MySQL Storage
│
├── 9. Quality Assurance
│   ├── Functional Testing
│   ├── Responsive Testing
│   ├── Form Testing
│   ├── Timer Testing
│   ├── Discussion Testing
│   └── Browser Testing
│
└── 10. Deployment
    ├── Hosting Account
    ├── Production Upload
    ├── PHP Verification
    ├── Public URL
    └── Final Submission

21. WORK BREAKDOWN STRUCTURE — WBS
The WBS defines the work required to produce the products.
1.0 Project Planning
1.1 Gather requirements
1.2 Define MVP
1.3 Define scope
1.4 Identify exclusions
1.5 Create Charter
1.6 Create PBS
1.7 Create WBS
1.8 Identify risks
1.9 Establish schedule

2.0 Environment Setup
2.1 Create project directory
2.2 Initialise Git repository
2.3 Create GitHub repository
2.4 Create folder structure
2.5 Create HTML files
2.6 Create CSS directory
2.7 Create JavaScript directory
2.8 Create PHP directory

3.0 HTML Development
3.1 Develop navigation
3.2 Develop footer
3.3 Develop Home structure
3.4 Develop About structure
3.5 Develop Focus structure
3.6 Develop Discussions structure
3.7 Develop Gallery structure
3.8 Develop Join structure
3.9 Validate navigation

4.0 CSS Development
4.1 Define colours
4.2 Define typography
4.3 Define spacing
4.4 Style navigation
4.5 Style buttons
4.6 Style cards
4.7 Style forms
4.8 Style focus dashboard
4.9 Style discussions
4.10 Create responsive layouts
4.11 Test mobile interface

5.0 Discussion Module
5.1 Learn JavaScript variables
5.2 Learn arrays
5.3 Learn objects
5.4 Create discussion data
5.5 Create render function
5.6 Loop through discussions
5.7 Manipulate DOM
5.8 Implement filters
5.9 Implement click events
5.10 Implement I'm in function
5.11 Implement capacity condition
5.12 Store selected participation
5.13 Test discussion module

6.0 Focus Module
6.1 Define timer state
6.2 Implement configurable duration
6.3 Implement start
6.4 Implement countdown
6.5 Implement pause
6.6 Implement resume
6.7 Implement stop
6.8 Implement break timer
6.9 Record completed sessions
6.10 Calculate focused minutes
6.11 Implement daily goal
6.12 Implement weekly goal
6.13 Implement progress display
6.14 Persist statistics
6.15 Test timer edge cases

7.0 Membership Module
7.1 Build form
7.2 Add HTML validation
7.3 Add JavaScript validation
7.4 Install/configure PHP environment
7.5 Build PHP processor
7.6 Sanitize form input
7.7 Display success response
7.8 Test invalid submissions
7.9 Test valid submissions
7.10 Optional MySQL integration

8.0 Gallery
8.1 Source appropriate imagery
8.2 Optimise images
8.3 Insert images
8.4 Add alt attributes
8.5 Add captions
8.6 Implement optional interaction

9.0 Testing and Quality
9.1 Test navigation
9.2 Test responsive layout
9.3 Test focus controls
9.4 Test focus calculations
9.5 Test discussion filters
9.6 Test discussion capacity
9.7 Test membership validation
9.8 Test PHP submission
9.9 Test browser compatibility
9.10 Correct defects
9.11 Final regression test

10.0 Deployment
10.1 Select PHP-compatible host
10.2 Configure hosting
10.3 Upload website
10.4 Verify PHP
10.5 Verify assets
10.6 Test production site
10.7 Test using another device
10.8 Record final URL
10.9 Submit project

22. WBS DICTIONARY — KEY WORK PACKAGES
Work Package
Deliverable
Completion Rule
HTML Foundation
Six linked pages
Every page loads and navigation works
CSS System
Responsive UI
No broken layouts on desktop/mobile
Discussion Module
Interactive discussions
Filters and I'm In operate correctly
Focus Module
Functional timer
Start/pause/resume/stop all work
Statistics
Goal tracking
Minutes and progress update correctly
Membership Form
Validated form
Invalid data blocked appropriately
PHP
Form processor
Valid submission generates response
Deployment
Public site
URL accessible externally
QA
Tested release
No known critical defects


23. SIX-DAY ACTIVITY PLAN
The schedule applies the principle:
Build highest-risk components early enough to fix them, but establish the basic system before adding complexity.

DAY 1 — PLAN AND BUILD THE HTML FOUNDATION
Main Objective
Create a complete but visually simple website structure.
Activities
Review requirements.
Freeze MVP scope.
Create Git repository.
Create project folders.
Build six HTML pages.
Create shared navigation.
Create footer.
Add page headings.
Add initial Home content.
Add About content.
Create Focus page UI shell.
Create Discussions page UI shell.
Create Gallery shell.
Create Join form.
Test all navigation.
Learning Focus
semantic HTML;
forms;
tables/lists;
page structure;
accessibility basics.
Deliverable
Complete navigable HTML prototype.
Daily Exit Criteria
Do not finish the day until:
six pages exist;
every page loads;
links work;
required assignment content is represented.
Milestone M1
Static website skeleton complete.

DAY 2 — CSS AND RESPONSIVE INTERFACE
Main Objective
Transform the HTML prototype into a consistent visual product.
Activities
Create external stylesheet.
Define design variables.
Style body and containers.
Style navigation.
Style hero.
Style buttons.
Create card component.
Style forms.
Style gallery.
Style progress elements.
Create responsive layout.
Add hover states.
Test mobile widths.
Learning Focus
box model;
flexbox;
CSS Grid;
positioning;
responsive CSS;
reusable classes.
Deliverable
Responsive styled website.
Daily Exit Criteria
all pages share the same design language;
no major overflow;
buttons and links are readable;
mobile layout works.
Milestone M2
Visual foundation complete.

DAY 3 — JAVASCRIPT FUNDAMENTALS AND DISCUSSIONS
Main Objective
Learn JavaScript by building the discussion feature.
Learning Sequence
Variables
Arrays
Objects
Functions
Loops
Conditionals
DOM
Events
localStorage
Activities
Create discussion objects.
Store objects in array.
Render discussion cards dynamically.
Display topic/category/module/location.
Add filters.
Implement filter events.
Add I'm In button.
Increase participant count.
Enforce capacity.
Cap host capacity at 15.
Disable full discussions.
Persist participation where practical.
Deliverable
Interactive Discussion Module.
Exit Criteria
discussion data comes from JavaScript;
filters work;
I'm In works;
capacity cannot be exceeded;
no duplicate joining from normal interaction.
Milestone M3
First major JavaScript feature complete.

DAY 4 — FOCUS TIMER AND HABIT METRICS
Main Objective
Build the project's flagship interactive feature.
Activities
Define timer variables.
Capture task/category.
Capture durations.
Implement countdown.
Implement Start.
Implement Pause.
Implement Resume.
Implement Stop.
Add break state.
Record completed sessions.
Calculate focused minutes.
Track reps.
Implement daily target.
Implement weekly target.
Calculate progress percentage.
Update progress indicators.
Save state/statistics with localStorage.
Test timer state transitions.
Deliverable
Functional Focus Module.
Exit Criteria
The timer must correctly survive:
Start → Pause → Resume;
Start → Stop;
completed focus block;
break transition;
multiple completed sessions.
Milestone M4
Core REPS feature complete.

DAY 5 — VALIDATION, PHP AND OPTIONAL DATABASE
Main Objective
Complete server-side requirements.
Activities
Review Join form.
Implement JavaScript validation.
Install/configure PHP environment.
Understand GET versus POST.
Create PHP processing file.
Retrieve submitted values.
Sanitize values.
Validate server-side input.
Display success response.
Display error response.
Test malformed input.
If core system is stable, connect to MySQL.
If MySQL threatens schedule, defer it.
Deliverable
Functional membership submission.
Exit Criteria
invalid form cannot silently pass;
valid form reaches PHP;
PHP shows appropriate response;
no raw errors appear to users.
Milestone M5
Functional MVP complete.

DAY 6 — TESTING, DEPLOYMENT AND PROJECT CLOSURE
Main Objective
Stabilise and release the system.
Activities
Freeze features.
Run complete testing checklist.
Fix critical defects first.
Fix high-severity defects.
Check spelling/content.
Validate navigation.
Test on desktop.
Test on mobile.
Test in another browser if possible.
Test timer.
Test filters.
Test Join form.
Select host.
Deploy application.
Test PHP remotely.
Test URL externally.
Add favicon/title/metadata.
Remove debugging statements.
Create final Git commit.
Record final URL.
Submit.
Deliverable
Production release.
Exit Criteria
URL works;
application works outside local machine;
no critical bugs;
assignment requirements can be demonstrated.
Milestone M6
Project complete and submitted.

24. ACTIVITY NETWORK AND DEPENDENCIES
The primary dependency chain is:
Requirements
    ↓
HTML Structure
    ↓
CSS Foundation
    ↓
JavaScript Modules
    ↓
PHP Processing
    ↓
Integration Testing
    ↓
Deployment
    ↓
Final Acceptance
Some activities can overlap:
                   ┌── Gallery
HTML ── CSS ────────┤
                    ├── Discussions ──┐
                    └── Focus ─────────┤
                                      ├── Testing ── Deployment
Join Form ── Validation ── PHP ────────┘
The likely critical path is:
HTML → CSS → JavaScript Core → PHP → Testing → Deployment
A delay in these activities can directly delay submission.

25. RISK REGISTER
ID
Risk
Probability
Impact
Response
R1
JavaScript learning takes longer than planned
High
High
Learn only concepts required by MVP
R2
Timer becomes too complex
Medium
High
Freeze timer features after Day 4 scope
R3
PHP setup fails
Medium
High
Begin PHP early on Day 5 and keep form processor simple
R4
Deployment host does not support PHP
Medium
High
Verify PHP support before committing to host
R5
Scope creep
High
High
Use Must/Should/Could/Won't list
R6
Styling consumes too much time
High
Medium
Stop visual refinement after baseline quality reached
R7
Database integration fails
Medium
Low
Treat MySQL as optional enhancement
R8
Mobile layout breaks
Medium
Medium
Test responsive design from Day 2
R9
Last-day critical bug
Medium
High
Freeze features before final testing
R10
Internet problems during deployment
Medium
High
Deploy before the final hours
R11
Code is submitted without understanding
Medium
High
Developer must explain each feature implemented
R12
Data lost during development
Low
High
Commit to Git frequently


26. CHANGE CONTROL
Any new feature proposed after scope freeze must answer:
Is it required by the assignment?
Does it contribute significantly to marks?
Can it be implemented without threatening the schedule?
Does it introduce a new technical dependency?
What existing work must be delayed to accommodate it?
If it is not required and threatens the schedule, it moves to:
Future REPS Backlog
Examples:
“Can we add login?”
Decision: Future backlog.
“Can we add a simple hover event to clearly demonstrate JavaScript events?”
Decision: Accept if trivial.
“Can we implement synchronized group timers?”
Decision: Reject from MVP.

27. QUALITY MANAGEMENT PLAN
Quality will be built into the project instead of inspected only at the end.
Prevention
simple architecture;
reusable CSS;
small JavaScript functions;
semantic HTML;
meaningful variable names;
version control;
regular testing.
Verification
Each work package must satisfy its exit criteria before the next stage is considered complete.
Validation
The final system will be checked against the original assignment question.

28. DEFINITION OF DONE
A feature is considered Done only when:
implementation is complete;
it works under normal use;
common errors have been tested;
the developer understands how it works;
the code is committed to Git;
it does not break other completed functions.
“Code written” does not mean “Done”.

29. TESTING CHECKLIST
Navigation
Home link works
About link works
Focus link works
Discussions link works
Gallery link works
Join link works
Focus
task input works
category works
custom focus duration works
custom break duration works
Start works
Pause works
Resume works
Stop works
session completes correctly
minutes update
reps update
daily progress updates
weekly progress updates
localStorage restores information
Discussions
all discussions display
Study filter works
Coding filter works
Project filter works
Challenge filter works
I'm In works
participant number increments
capacity respected
capacity cannot exceed 15
Full status displays correctly
Join Form
empty required field rejected
invalid email rejected
valid submission accepted
PHP receives values
success message displayed
Responsive Design
desktop
tablet
mobile
Deployment
public URL loads
CSS loads
JavaScript loads
images load
PHP works
HTTPS works if available

30. CONFIGURATION MANAGEMENT
Git will be used for version control.
Recommended branch approach for this short project:
main
Because there is one developer and six days, unnecessary branching complexity should be avoided.
Recommended commits:
feat: create site structure
feat: add responsive navigation
style: implement REPS design system
feat: render discussion cards
feat: add discussion filters
feat: implement discussion joining
feat: create focus timer
feat: track focus goals
feat: validate join form
feat: process form with PHP
fix: resolve mobile navigation issue
fix: correct timer pause behaviour
chore: prepare production release
Commit at meaningful milestones instead of one giant final commit.

31. COMMUNICATION PLAN
Because this is an individual project, formal team communication is unnecessary.
Progress communication will occur through:
personal project notes;
Git commit history;
daily progress review;
lecturer clarification when necessary.
A short daily status should answer:
Completed
What was finished today?
Blocked
What stopped progress?
Next
What is the next most important task?
Scope
Did any new idea threaten the MVP?

32. DAILY REVIEW FORMAT
At the end of every project day:
1. Planned
What was supposed to be completed?
2. Actual
What was actually completed?
3. Variance
What was not completed and why?
4. Corrective Action
What changes are required tomorrow?
5. Risk Update
Did any existing risk increase?
6. Lessons Learned
What technical or project-management lesson was learned?
This applies monitoring and control instead of simply following a schedule blindly.

33. SIMPLE EARNED-PROGRESS APPROACH
Because this is a short student project, traditional Earned Value Management would be unnecessarily heavy.
Instead, progress will be monitored through milestone completion.
Milestone
Target
Weight
M1 HTML
Day 1
15%
M2 CSS
Day 2
15%
M3 Discussions
Day 3
20%
M4 Focus
Day 4
25%
M5 PHP MVP
Day 5
15%
M6 Deployment
Day 6
10%

Total:
100%
A milestone counts only when its exit criteria are satisfied.

34. PROJECT SCHEDULE SUMMARY
Day
Primary Work
Milestone
Day 1
Planning + HTML
M1
Day 2
CSS + Responsive Design
M2
Day 3
JavaScript + Discussions
M3
Day 4
Focus Timer + Statistics
M4
Day 5
Form Validation + PHP
M5
Day 6
Testing + Deployment
M6


35. PROJECT PRIORITY TRIANGLE
For this project:
Time
Fixed
The deadline cannot move.
Scope
Flexible
Non-essential features can be removed.
Quality
Protected
Core functionality must work correctly.
Therefore, when pressure increases:
Reduce scope before reducing quality or missing the deadline.
This is one of the main project-management rules for REPS.

36. MVP MANAGEMENT PRINCIPLE
The development order will follow:
Make it exist → Make it work → Make it reliable → Make it polished.
Not:
Make the first page beautiful while the core system remains unfinished.
This means:
First
Complete structural HTML.
Second
Implement functionality.
Third
Test.
Fourth
Polish.

37. PROJECT CLOSURE
Before closure:
verify deliverables;
confirm public URL;
ensure code is committed;
verify assignment requirements;
record outstanding future work;
document lessons learned.
The project will formally close once the working URL has been submitted.

38. POST-PROJECT LESSONS LEARNED
After submission, review:
Product
Which REPS features were actually useful?
What was unnecessary?
Would students genuinely use the concept?
Technical
What was learned about JavaScript?
What was learned about PHP?
What was learned about hosting?
Project Management
Was six-day planning realistic?
Which estimates were inaccurate?
What caused schedule variance?
Where did scope creep occur?
Which risks actually happened?
Personal Development
Which tasks were avoided because they were difficult?
Where did deliberate practice produce progress?
How did repeated implementation improve understanding?
This reflection aligns strongly with REPS itself:
Put in the reps, review the result, improve the system, repeat.

39. FINAL PROJECT STATEMENT
REPS is intentionally not a large software platform in its first version.
The semester project will establish a small but complete system demonstrating core web-development concepts while providing a realistic foundation for a future HIT student community.
The priority is therefore:
Complete over complex.
Functional over flashy.
Action over motion.
Quality over feature count.
Steward your time. Put in the reps. Pursue excellence.

