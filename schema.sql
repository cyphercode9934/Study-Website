CREATE DATABASE IF NOT EXISTS study_web_db;
USE study_web_db;

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO courses (id, course_code, course_name) VALUES 
(1, 'CS0011', 'Mobile Programming'),
(2, '?', 'Coming Soon...');

CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    module_num INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_course_module
        (course_id, module_num)
);

INSERT IGNORE INTO modules
(course_id, module_num, module_name)
VALUES
(1, 1, 'Introduction to Android'),
(1, 2, 'Android Studio'),
(1, 3, 'Kotlin'),
(1, 4, 'Application Components & Resources'),
(1, 5, 'Activities'),

(2, 1, 'Module 1');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Topics Table (Bound to Course)
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_topic (course_id, topic_name)
);

-- 4. Questions Bank Table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL DEFAULT 1,
    module_num INT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    category ENUM('conceptual', 'technical_fitb', 'technical_error_detection') NOT NULL,
    question_type ENUM('multiple_choice', 'fill_in_blank', 'identification') NOT NULL,
    question_text TEXT NOT NULL,
    code_snippet TEXT DEFAULT NULL,
    options JSON DEFAULT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 5. Exam Sessions
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    course_id INT NOT NULL,

    selected_modules JSON NOT NULL,
    selected_question_types JSON NOT NULL,

    question_limit INT NOT NULL,

    status ENUM('in_progress', 'completed')
        NOT NULL DEFAULT 'in_progress',

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);

-- 6. Exam Responses
CREATE TABLE IF NOT EXISTS exam_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    session_id INT NOT NULL,
    question_id INT NOT NULL,

    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,

    was_checked BOOLEAN NOT NULL DEFAULT FALSE,

    checked_at TIMESTAMP NULL DEFAULT NULL,
    submitted_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id)
        REFERENCES exam_sessions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_session_question
        (session_id, question_id)
);

-- Default Topics
INSERT IGNORE INTO topics (course_id, topic_name) VALUES
(1, 'Activity Basics'),
(1, 'Activity Creation'),
(1, 'Activity Execution'),
(1, 'Activity Lifecycle'),
(1, 'Activity Manifest'),
(1, 'Android Architecture'),
(1, 'Android History'),
(1, 'Android Overview'),
(1, 'Android Studio'),
(1, 'Android Versions'),
(1, 'Application Components'),
(1, 'Deployment'),
(1, 'IDE Interface'),
(1, 'Kotlin Android'),
(1, 'Kotlin Basics'),
(1, 'Kotlin Comments'),
(1, 'Kotlin Control Flow'),
(1, 'Kotlin Conversion'),
(1, 'Kotlin Features'),
(1, 'Kotlin Fundamentals'),
(1, 'Kotlin Interoperability'),
(1, 'Kotlin Loops'),
(1, 'Kotlin Null Safety'),
(1, 'Kotlin Objects'),
(1, 'Kotlin OOP'),
(1, 'Kotlin Overview'),
(1, 'Kotlin Syntax'),
(1, 'Kotlin vs Java'),
(1, 'Project Creation'),
(1, 'Resources Access'),
(1, 'Resources Organization'),
(1, 'System Requirements');

-- Initial Question Bank
INSERT INTO questions (course_id, module_num, topic, category, question_type, question_text, code_snippet, options, correct_answer, explanation) VALUES
-- ============================================================================
-- MODULE 1: INTRODUCTION TO ANDROID (27 Questions)
-- ============================================================================
(1, 1, 'Android Overview', 'conceptual', 'multiple_choice', 'Which kernel forms the foundation of the Android Operating System?', NULL, '["Linux", "Windows", "Unix", "MS-DOS"]', 'Linux', 'Android is a mobile operating system based on the Linux kernel.'),
(1, 1, 'Android History', 'conceptual', 'identification', 'In what year did Google purchase Android Inc.?', NULL, NULL, '2005', 'Google purchased Android Inc. in 2005.'),
(1, 1, 'Android Overview', 'conceptual', 'multiple_choice', 'Which of the following is an advantage of the Android platform?', NULL, '["Open Source", "Reduced Development Cost", "Inter App Integration", "All of the above"]', 'All of the above', 'Android features include open-source distribution, reduced development costs, inter-app integration, and a rich development environment.'),
(1, 1, 'Android Versions', 'conceptual', 'identification', 'Which device was the first commercial Android phone to run Android 1.0?', NULL, NULL, 'HTC Dream', 'The first commercial Android version was placed on the HTC Dream device.'),
(1, 1, 'Android Versions', 'conceptual', 'fill_in_blank', 'The official codename given to Android version 1.5 was ___', NULL, NULL, 'Cupcake', 'Android 1.5 Cupcake was the first release with an official dessert codename.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Which feature was introduced in Android 1.6 Donut?', NULL, '["Support for large screen sizes", "Picture-in-Picture", "Dynamic depth photos", "App Bubbles"]', 'Support for large screen sizes', 'Android 1.6 Donut introduced support for large screen sizes, gallery/camera integration, and system speed improvements.'),
(1, 1, 'Android Versions', 'conceptual', 'fill_in_blank', 'Android 2.0 and 2.1 were released under the codename ___', NULL, NULL, 'Eclair', 'Android 2.0 and 2.1 were released under the codename Eclair.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Wi-Fi Hotspot functionality and animated GIF support were introduced in which Android version?', NULL, '["Android 2.2 Froyo", "Android 2.3 Gingerbread", "Android 4.0 ICS", "Android 5.0 Lollipop"]', 'Android 2.2 Froyo', 'Android 2.2 Froyo introduced Wi-Fi Hotspot functionality, animated GIF support, and browser file uploads.'),
(1, 1, 'Android Versions', 'conceptual', 'identification', 'Which Android version was co-developed with Samsung and officially announced on the Nexus S phone?', NULL, NULL, 'Gingerbread', 'Android 2.3 Gingerbread was officially announced on the Nexus S device co-developed with Samsung.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Which Android release was specifically designed for tablets with a 3D UI?', NULL, '["Android 3.0 Honeycomb", "Android 2.2 Froyo", "Android 4.4 KitKat", "Android 7.0 Nougat"]', 'Android 3.0 Honeycomb', 'Android 3.0 Honeycomb was released specifically for tablets with a 3D UI update.'),
(1, 1, 'Android Versions', 'conceptual', 'fill_in_blank', 'Android 4.0 Ice Cream Sandwich synthesized Honeycomb and introduced Face ___', NULL, NULL, 'Lock', 'Android 4.0 Ice Cream Sandwich introduced Face Lock, Wi-Fi Direct, and tabbed browsing.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'What was the primary feature introduced in Android 4.1 Jelly Bean?', NULL, '["Google Now", "Picture in Picture", "Scrolling Screenshots", "Privacy Sandbox"]', 'Google Now', 'Google Now was the main headline feature introduced in Android 4.1 Jelly Bean.'),
(1, 1, 'Android Versions', 'conceptual', 'identification', 'What voice command feature was introduced in Android 4.4 KitKat to trigger Google Now hands-free?', NULL, NULL, 'OK Google', 'Android 4.4 KitKat introduced "OK Google" hands-free voice access.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Which runtime environment was introduced in Android 5.0 Lollipop to replace Dalvik?', NULL, '["ART", "JVM", "DVM", "CLR"]', 'ART', 'Android 5.0 Lollipop introduced ART (Android RunTime) alongside Material Design.'),
(1, 1, 'Android Versions', 'conceptual', 'fill_in_blank', 'Runtime app permission prompts (OPT-in) and fingerprint authentication were added in Android 6.0 ___', NULL, NULL, 'Marshmallow', 'Android 6.0 Marshmallow brought native fingerprint authentication and runtime app permissions.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Native split-screen multi-window mode was introduced in which Android version?', NULL, '["Android 7.0 Nougat", "Android 5.0 Lollipop", "Android 8.0 Oreo", "Android 10"]', 'Android 7.0 Nougat', 'Android 7.0 Nougat introduced native split-screen multi-window mode and Data Saver.'),
(1, 1, 'Android Versions', 'conceptual', 'identification', 'Which feature introduced in Android 8.0 Oreo allows users to view videos in a floating window while using other apps?', NULL, NULL, 'Picture-in-Picture', 'Android 8.0 Oreo introduced Picture-in-Picture (PIP) and adaptive icons.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Adaptive Battery prediction and display cutout (notch) support were introduced in:', NULL, '["Android 9.0 Pie", "Android 10", "Android 11", "Android 12"]', 'Android 9.0 Pie', 'Android 9.0 Pie introduced Adaptive Battery, Adaptive Brightness, and display cutout support.'),
(1, 1, 'Android Versions', 'conceptual', 'fill_in_blank', 'System-wide Dark Theme was officially introduced in Android ___', NULL, NULL, '10', 'Android 10 introduced a system-wide Dark Theme, dynamic depth photo formatting, and location permissions.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Which feature was introduced in Android 11?', NULL, '["Chat Bubbles & Native Screen Recording", "ART Runtime", "Face Lock", "Live Wallpapers"]', 'Chat Bubbles & Native Screen Recording', 'Android 11 introduced conversation bubbles, native screen recording, and auto-revoking permissions.'),
(1, 1, 'Android Versions', 'conceptual', 'identification', 'What internal dessert codename was assigned to Android 12?', NULL, NULL, 'Snow Cone', 'Android 12 was internally codenamed Snow Cone.'),
(1, 1, 'Android Versions', 'conceptual', 'multiple_choice', 'Per-app language preferences and the photo picker were introduced in:', NULL, '["Android 13", "Android 14", "Android 15", "Android 16"]', 'Android 13', 'Android 13 introduced the Photo Picker, native LE Bluetooth support, and per-app language settings.'),
(1, 1, 'Android Architecture', 'conceptual', 'identification', 'What are the 5 layers of the Android Software Architecture stack?', NULL, NULL, 'Applications, Application Framework, Android Runtime, Platform Libraries, Linux Kernel', 'The 5 architecture layers are Applications, Application Framework, Android Runtime, Platform Libraries, and Linux Kernel.'),
(1, 1, 'Android Architecture', 'conceptual', 'multiple_choice', 'Which architecture layer contains the Activity Manager, Package Manager, and Content Providers?', NULL, '["Application Framework", "Linux Kernel", "Platform Libraries", "Android Runtime"]', 'Application Framework', 'The Application Framework layer exposes services like Activity Manager, Package Manager, and Content Providers.'),
(1, 1, 'Android Architecture', 'conceptual', 'fill_in_blank', 'Embedded lightweight database support in the Platform Libraries layer is provided by ___', NULL, NULL, 'SQLite', 'SQLite is included in the Platform Libraries layer for database management.'),
(1, 1, 'Android Architecture', 'conceptual', 'multiple_choice', 'Which core component in the Linux Kernel handles inter-process communication (IPC) in Android?', NULL, '["Binder IPC Driver", "Display Driver", "USB Driver", "Wi-Fi Driver"]', 'Binder IPC Driver', 'The Binder IPC Driver inside the Linux Kernel is responsible for inter-process communication.'),
(1, 1, 'Android Architecture', 'conceptual', 'identification', 'Which virtual machine was historically responsible for executing Android applications before ART?', NULL, NULL, 'Dalvik Virtual Machine', 'The Dalvik Virtual Machine (DVM) was responsible for running mobile applications prior to ART.'),

-- ============================================================================
-- MODULE 2: ANDROID STUDIO (10 Questions)
-- ============================================================================
(1, 2, 'System Requirements', 'conceptual', 'multiple_choice', 'What is the recommended RAM for running Android Studio and the Android Emulator?', NULL, '["8 GB RAM", "2 GB RAM", "1 GB RAM", "512 MB RAM"]', '8 GB RAM', 'Android Studio requires a minimum of 3 GB RAM, but 8 GB RAM is recommended plus 1 GB for the emulator.'),
(1, 2, 'System Requirements', 'conceptual', 'fill_in_blank', 'The minimum screen resolution required to run Android Studio is ___', NULL, NULL, '1280x800', 'The system requirements specify a minimum screen resolution of 1280x800.'),
(1, 2, 'Project Creation', 'conceptual', 'multiple_choice', 'Which default activity template is selected when creating a basic new project in Android Studio?', NULL, '["Empty Views Activity", "No Activity", "C++ Activity", "Automotive Activity"]', 'Empty Views Activity', 'Selecting Empty Views Activity creates a project with a basic layout and activity setup.'),
(1, 2, 'Project Creation', 'conceptual', 'identification', 'What naming convention format is typically used for an Android Package Name during setup?', NULL, NULL, 'com.example.myapp', 'Package names follow reverse domain structure, e.g., com.example.myapplication.'),
(1, 2, 'IDE Interface', 'conceptual', 'multiple_choice', 'Which IDE window section allows you to write and modify layout and source code files?', NULL, '["Editor Window", "Navigation Bar", "Status Bar", "Tool Window Bar"]', 'Editor Window', 'The Editor Window is where you create and edit Kotlin/Java code and XML layouts.'),
(1, 2, 'IDE Interface', 'conceptual', 'fill_in_blank', 'The bar located around the outside of the IDE containing project management buttons is called the Tool ___ Bar.', NULL, NULL, 'Window', 'The Tool Window Bar runs along the outer frame to collapse and expand task panels.'),
(1, 2, 'IDE Interface', 'conceptual', 'identification', 'Which component at the very bottom of Android Studio displays build status and warnings?', NULL, NULL, 'Status Bar', 'The Status Bar displays the status of the project, IDE, and compilation messages.'),
(1, 2, 'Deployment', 'conceptual', 'multiple_choice', 'To run and debug an app on a physical Android device, which setting must be enabled on the phone?', NULL, '["USB Debugging", "Airplane Mode", "NFC Transfer", "Battery Saver"]', 'USB Debugging', 'USB Debugging must be enabled under Developer Options on a physical device.'),
(1, 2, 'Deployment', 'conceptual', 'identification', 'What tool inside Android Studio is used to create and configure Android Virtual Devices (AVDs)?', NULL, NULL, 'Device Manager', 'Device Manager allows developers to select hardware profiles and download system images for emulators.'),
(1, 2, 'Deployment', 'conceptual', 'fill_in_blank', 'Virtual hardware testing instances configured in Android Studio are referred to as ___', NULL, NULL, 'Emulators', 'Applications can be run virtually on built-in Android emulators.'),

-- ============================================================================
-- MODULE 3: INTRODUCTION TO KOTLIN (30 Questions)
-- ============================================================================
(1, 3, 'Kotlin Overview', 'conceptual', 'multiple_choice', 'In what year was Kotlin released by JetBrains?', NULL, '["2016", "2010", "2005", "2020"]', '2016', 'Kotlin was officially released in 2016 by JetBrains.'),
(1, 3, 'Kotlin Syntax', 'conceptual', 'identification', 'Which keyword is used to declare a function in Kotlin?', NULL, NULL, 'fun', 'The fun keyword is used to declare functions in Kotlin.'),
(1, 3, 'Kotlin Syntax', 'technical_fitb', 'multiple_choice', 'What keyword is used to declare an immutable (read-only) variable in Kotlin?', NULL, '["val", "var", "const", "static"]', 'val', 'val is used to declare immutable references, whereas var creates mutable variables.'),
(1, 3, 'Kotlin Syntax', 'technical_fitb', 'fill_in_blank', 'Variables declared with the ___ keyword can be reassigned after initialization.', NULL, NULL, 'var', 'The var keyword creates mutable variables that can be modified after initialization.'),
(1, 3, 'Kotlin Syntax', 'technical_error_detection', 'multiple_choice', 'Identify the compilation error in this Kotlin snippet:', 'val x = 10\nx = 20', '["Reassignment to immutable val", "Missing semicolon", "Invalid type inference", "Syntax error in integer"]', 'Reassignment to immutable val', 'Variables declared with val are immutable and cannot be reassigned.'),
(1, 3, 'Kotlin Null Safety', 'technical_fitb', 'multiple_choice', 'Which modifier promises to initialize a non-null variable at a later point before usage?', NULL, '["lateinit", "nullable", "lazy", "defer"]', 'lateinit', 'lateinit var allows declaring a non-null property that will be initialized later.'),
(1, 3, 'Kotlin Null Safety', 'technical_error_detection', 'multiple_choice', 'What is wrong with the following code snippet?', 'var str: String = "Hello"\nstr = null', '["Cannot assign null to non-null String", "val should be used", "lateinit required", "String must be capitalized"]', 'Cannot assign null to non-null String', 'In Kotlin, types are non-null by default. String? must be used to allow null.'),
(1, 3, 'Kotlin Control Flow', 'technical_fitb', 'multiple_choice', 'What is the output of the following statement?', 'val greeting = if (20 < 18) "Day" else "Night"\nprintln(greeting)', '["Night", "Day", "null", "Compilation Error"]', 'Night', 'Since 20 < 18 is false, the expression evaluates to "Night".'),
(1, 3, 'Kotlin Control Flow', 'conceptual', 'identification', 'Which Kotlin control flow expression serves as a direct replacement for Java switch statements?', NULL, NULL, 'when', 'The when expression replaces traditional switch statements in Kotlin.'),
(1, 3, 'Kotlin Control Flow', 'technical_fitb', 'fill_in_blank', 'In Kotlin ranges, the syntax `for (x in 5..10)` will iterate from 5 to ___ inclusive.', NULL, NULL, '10', 'The range operator `..` includes both the starting and ending values inclusive.'),
(1, 3, 'Kotlin Loops', 'technical_fitb', 'multiple_choice', 'What will this loop output?', 'val nums = arrayOf(1, 5, 10)\nfor (x in nums) { print("$x ") }', '["1 5 10 ", "1..10", "3", "0 1 2 "]', '1 5 10 ', 'The for loop iterates through array elements directly.'),
(1, 3, 'Kotlin OOP', 'conceptual', 'multiple_choice', 'How do you instantiate an object of class `Car` in Kotlin without constructors?', NULL, '["val c1 = Car()", "Car c1 = new Car();", "val c1 = new Car()", "Car c1 = Car.create()"]', 'val c1 = Car()', 'Kotlin does not use the `new` keyword for object instantiation.'),
(1, 3, 'Kotlin OOP', 'conceptual', 'fill_in_blank', 'To allow a class to be inherited in Kotlin, it must be marked with the ___ keyword.', NULL, NULL, 'open', 'Classes in Kotlin are final by default; they must be declared open to allow inheritance.'),
(1, 3, 'Kotlin OOP', 'technical_fitb', 'multiple_choice', 'What block is executed automatically right after primary constructor initialization?', NULL, '["init", "construct", "create", "main"]', 'init', 'Initializer blocks (`init`) run sequentially immediately after primary constructor execution.'),
(1, 3, 'Kotlin OOP', 'technical_fitb', 'fill_in_blank', 'In constructor declarations, default argument values can be set like `class Employee(val id: Int = ___)`', NULL, NULL, '100', 'Primary constructor parameters can specify default parameter values.'),
(1, 3, 'Kotlin OOP', 'conceptual', 'identification', 'What keyword introduces secondary constructors inside a Kotlin class body?', NULL, NULL, 'constructor', 'Secondary constructors are explicitly declared using the `constructor` keyword.'),
(1, 3, 'Kotlin vs Java', 'conceptual', 'multiple_choice', 'How does Kotlin handle static class members found in Java?', NULL, '["Companion Objects", "Static methods", "Global pointers", "Wildcards"]', 'Companion Objects', 'Kotlin does not have static members; companion objects are used instead.'),
(1, 3, 'Kotlin vs Java', 'conceptual', 'fill_in_blank', 'Kotlin completely eliminates checked ___ present in Java.', NULL, NULL, 'exceptions', 'Kotlin removed checked exceptions entirely from its language design.'),
(1, 3, 'Kotlin vs Java', 'conceptual', 'identification', 'What feature in Kotlin automatically casts a variable after a type check (`is`)?', NULL, NULL, 'Smartcast', 'Smartcasts automatically cast variables once verified by `is` checks.'),
(1, 3, 'Kotlin Syntax', 'technical_fitb', 'multiple_choice', 'What will be printed by this string template expression?', 'val age = 20\nprintln("Age is $age")', '["Age is 20", "Age is $age", "Age is age", "Compilation Error"]', 'Age is 20', 'String templates evaluate variable references prefixed with `$`.'),
(1, 3, 'Kotlin Interoperability', 'conceptual', 'multiple_choice', 'What bytecode format do both Java and Kotlin compile down to?', NULL, '["JVM Bytecode", "ARM Machine Code", "DALVIK C++", "LLVM IR"]', 'JVM Bytecode', 'Both Java and Kotlin compile down to JVM bytecode.'),
(1, 3, 'Kotlin Conversion', 'conceptual', 'identification', 'What is the keyboard shortcut in Android Studio to convert a Java file to Kotlin?', NULL, NULL, 'Ctrl+Alt+Shift+K', 'Ctrl+Alt+Shift+K converts an open Java file into a Kotlin file.'),
(1, 3, 'Kotlin Conversion', 'conceptual', 'fill_in_blank', 'When converting Java to Kotlin, the file extension changes from .java to ___', NULL, NULL, '.kt', 'Kotlin source code files use the `.kt` file extension.'),
(1, 3, 'Kotlin Android', 'technical_fitb', 'multiple_choice', 'In Kotlin Android views, how do you set text on a TextView variable `textView`?', NULL, '["textView.text = \\"Hello\\"", "textView.setText(\\"Hello\\");", "textView->text(\\"Hello\\")", "setText(textView, \\"Hello\\")"]', 'textView.text = "Hello"', 'Kotlin allows synthetic property syntax access like `textView.text = "Hello"`.'),
(1, 3, 'Kotlin Fundamentals', 'conceptual', 'multiple_choice', 'Which statement about Kotlin line endings is correct?', NULL, '["Semicolons are optional", "Semicolons are strictly required", "Lines must end with a colon", "Lines must end with a period"]', 'Semicolons are optional', 'In Kotlin, statements do not have to end with a semicolon.'),
(1, 3, 'Kotlin Comments', 'conceptual', 'fill_in_blank', 'Single line comments in Kotlin start with double slashes ___', NULL, NULL, '//', 'Single line comments in Kotlin are written using `//`.'),
(1, 3, 'Kotlin Basics', 'conceptual', 'identification', 'What entry point function is required to execute any standalone Kotlin program?', NULL, NULL, 'main()', 'The `main()` function is the execution entry point of a Kotlin program.'),
(1, 3, 'Kotlin Features', 'conceptual', 'multiple_choice', 'Which feature allows adding new functions to existing classes without modifying their source?', NULL, '["Extension Functions", "Primary Constructors", "Operator Overloading", "Smartcasts"]', 'Extension Functions', 'Extension functions allow extending a class with new functionality without inheritance.'),
(1, 3, 'Kotlin Objects', 'technical_fitb', 'multiple_choice', 'What is the output of this instantiation snippet?', 'class Person(val name: String = "Abe")\nval p = Person()\nprintln(p.name)', '["Abe", "null", "Person", "Compilation Error"]', 'Abe', 'Since no constructor arguments were supplied, the default value "Abe" is assigned.'),
(1, 3, 'Kotlin Conversion', 'conceptual', 'fill_in_blank', 'Pasting Java code directly into a `.kt` file triggers automatic code ___', NULL, NULL, 'conversion', 'Android Studio automatically offers to convert pasted Java code snippets into Kotlin.'),

-- ============================================================================
-- MODULE 4: APPLICATION COMPONENTS AND RESOURCES (18 Questions)
-- ============================================================================
(1, 4, 'Application Components', 'conceptual', 'multiple_choice', 'Which central configuration file links all application components together?', NULL, '["AndroidManifest.xml", "build.gradle", "strings.xml", "R.java"]', 'AndroidManifest.xml', 'The application manifest AndroidManifest.xml describes each component and its interactions.'),
(1, 4, 'Application Components', 'conceptual', 'identification', 'Which core application component presents a single UI screen to the user?', NULL, NULL, 'Activity', 'An activity dictates the user interface and handles user interaction on a single screen.'),
(1, 4, 'Application Components', 'conceptual', 'multiple_choice', 'Which component handles background processing without providing a user interface?', NULL, '["Service", "Activity", "Content Provider", "View"]', 'Service', 'A Service runs in the background to perform long-running operations like playing music.'),
(1, 4, 'Application Components', 'conceptual', 'fill_in_blank', 'Inter-application broadcast messages from the system are intercepted by Broadcast ___', NULL, NULL, 'Receivers', 'Broadcast Receivers intercept and respond to system-wide or app-initiated broadcast notifications.'),
(1, 4, 'Application Components', 'conceptual', 'identification', 'Which application component manages shared app data and database access requests?', NULL, NULL, 'Content Provider', 'Content Providers supply data from one application to others upon request.'),
(1, 4, 'Application Components', 'conceptual', 'multiple_choice', 'Asynchronous messaging objects used to request actions from other components are called:', NULL, '["Intents", "Layouts", "Views", "Fragments"]', 'Intents', 'Intents are message objects that wire application components together.'),
(1, 4, 'Application Components', 'conceptual', 'fill_in_blank', 'Reusable portions of user interface nested inside an Activity are called ___', NULL, NULL, 'Fragments', 'Fragments represent a modular portion of a user interface inside an activity.'),
(1, 4, 'Resources Organization', 'conceptual', 'multiple_choice', 'In which directory under `res/` are vector shapes, bitmaps, and layer lists stored?', NULL, '["res/drawable/", "res/layout/", "res/values/", "res/mipmap/"]', 'res/drawable/', 'Bitmap files (.png, .jpg) and XML shape drawables reside inside `res/drawable/`.'),
(1, 4, 'Resources Organization', 'conceptual', 'identification', 'Which `res/` directory holds XML files defining screen user interface layouts?', NULL, NULL, 'res/layout/', 'Layout definitions for user interfaces are stored in `res/layout/`.'),
(1, 4, 'Resources Organization', 'conceptual', 'multiple_choice', 'Where are simple value XML files like `strings.xml`, `colors.xml`, and `styles.xml` stored?', NULL, '["res/values/", "res/raw/", "res/xml/", "res/font/"]', 'res/values/', 'The `res/values/` subfolder holds XML files containing strings, integers, colors, and styles.'),
(1, 4, 'Resources Organization', 'conceptual', 'fill_in_blank', 'Arbitrary raw files saved in their uncompiled form belong inside the res/___/ directory.', NULL, NULL, 'raw', 'Arbitrary assets accessed via raw stream resource IDs are saved under `res/raw/`.'),
(1, 4, 'Resources Organization', 'conceptual', 'identification', 'Which resource folder contains app launcher icons targeted for different screen densities?', NULL, NULL, 'res/mipmap/', 'Mipmap directories (`res/mipmap/`) hold launcher icons across resolutions.'),
(1, 4, 'Resources Access', 'conceptual', 'multiple_choice', 'What auto-generated class contains integer resource IDs for accessing resources in code?', NULL, '["R class", "BuildConfig", "Manifest class", "System class"]', 'R class', 'When compiled, an `R` class is generated containing static integer IDs for all assets in `res/`.'),
(1, 4, 'Resources Access', 'technical_fitb', 'multiple_choice', 'How do you programmatically reference a string resource named `hello` in Kotlin?', NULL, '["R.string.hello", "@string/hello", "res.strings.hello", "String.get(hello)"]', 'R.string.hello', 'Resources are accessed in code via `R.subdirectory.filename` notation.'),
(1, 4, 'Resources Access', 'technical_fitb', 'fill_in_blank', 'To reference a color resource named `primary` inside an XML layout, use the syntax `@color/___`', NULL, NULL, 'primary', 'XML layout references use the `@type/res_name` prefix.'),
(1, 4, 'Resources Access', 'technical_fitb', 'multiple_choice', 'Which code snippet loads an XML layout file `activity_main.xml` inside an Activity `onCreate` callback?', NULL, '["setContentView(R.layout.activity_main);", "inflate(R.id.activity_main);", "setLayout(activity_main);", "R.layout.activity_main.load();"]', 'setContentView(R.layout.activity_main);', '`setContentView()` inflates the visual layout resource onto the activity screen.'),
(1, 4, 'Resources Access', 'technical_fitb', 'fill_in_blank', 'To set an image view programmatically to `myimage.png`, call `imageView.setImageResource(R.drawable.___ )`', NULL, NULL, 'myimage', '`setImageResource()` accepts a drawable resource ID generated in `R.drawable`.'),
(1, 4, 'Resources Organization', 'conceptual', 'identification', 'Which `res/` subfolder contains XML property animation files accessed via `R.animator`?', NULL, NULL, 'res/animator/', 'Property animations are stored in `res/animator/` and accessed via `R.animator`.'),

-- ============================================================================
-- MODULE 5: ACTIVITIES (15 Questions)
-- ============================================================================
(1, 5, 'Activity Basics', 'conceptual', 'multiple_choice', 'In desktop applications, an Android Activity is equivalent to a:', NULL, '["Window", "Database", "File Stream", "Process Thread"]', 'Window', 'An Activity represents one visual screen, very similar to a desktop window.'),
(1, 5, 'Activity Creation', 'conceptual', 'fill_in_blank', 'All Android activity classes must inherit directly or indirectly from android.app.___', NULL, NULL, 'Activity', 'Every activity class is a subclass of `android.app.Activity` or `AppCompatActivity`.'),
(1, 5, 'Activity Manifest', 'conceptual', 'identification', 'Which XML tag inside `AndroidManifest.xml` registers an Activity component?', NULL, NULL, '<activity>', 'Activities must be declared as child `<activity>` elements under `<application>`.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'multiple_choice', 'Which callback is the very first method invoked when an Activity is created?', NULL, '["onCreate()", "onStart()", "onResume()", "onRestart()"]', 'onCreate()', '`onCreate()` is the first callback fired when an activity is launched.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'fill_in_blank', 'The callback invoked when an activity becomes visually visible to the user is ___', NULL, NULL, 'onStart()', '`onStart()` is called when the activity becomes visible.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'multiple_choice', 'When an activity enters the foreground and starts receiving user input, which method is called?', NULL, '["onResume()", "onStart()", "onPause()", "onCreate()"]', 'onResume()', '`onResume()` is invoked when the activity enters the running foreground state.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'identification', 'Which lifecycle callback is invoked when an activity is partially hidden or losing user focus?', NULL, NULL, 'onPause()', '`onPause()` fires when another activity comes into the foreground, partially obscuring the screen.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'multiple_choice', 'Which method is called when an activity is no longer visible on screen?', NULL, '["onStop()", "onPause()", "onDestroy()", "onRestart()"]', 'onStop()', '`onStop()` is called when the activity is completely hidden from view.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'fill_in_blank', 'Before an activity is completely removed from memory, the system calls on___()', NULL, NULL, 'Destroy', '`onDestroy()` is the final callback received before system destruction.'),
(1, 5, 'Activity Lifecycle', 'conceptual', 'identification', 'Which lifecycle callback executes when a stopped activity is navigated back to by the user?', NULL, NULL, 'onRestart()', '`onRestart()` fires when an activity restarts after being stopped.'),
(1, 5, 'Activity Lifecycle', 'technical_fitb', 'multiple_choice', 'What is the correct execution order of callbacks during normal activity startup?', NULL, '["onCreate() -> onStart() -> onResume()", "onStart() -> onCreate() -> onResume()", "onResume() -> onStart() -> onCreate()", "onCreate() -> onResume() -> onStart()"]', 'onCreate() -> onStart() -> onResume()', 'The startup lifecycle sequence is `onCreate()`, followed by `onStart()`, then `onResume()`.'),
(1, 5, 'Activity Creation', 'technical_fitb', 'fill_in_blank', 'In Kotlin activity creation, views are inflated inside `onCreate()` using `setContentView(R.layout.___)`', NULL, NULL, 'activity_main', '`setContentView(R.layout.activity_main)` loads the associated XML design file.'),
(1, 5, 'Activity Execution', 'conceptual', 'multiple_choice', 'What happens if Android system memory is critically low while an activity is stopped or paused?', NULL, '["The OS kills the process", "The app freezes permanently", "It auto-reboots the device", "It skips to onDestroy()"]', 'The OS kills the process', 'When high-priority apps require memory, the OS kills background processes in `onPause()` or `onStop()`.'),
(1, 5, 'Activity Basics', 'conceptual', 'identification', 'Which activity is launched automatically when a user opens the application icon?', NULL, NULL, 'Main Activity', 'The app starts by showing the designated main activity.'),
(1, 5, 'Activity Lifecycle', 'technical_fitb', 'multiple_choice', 'In Java/Kotlin, what method call must be executed first inside overridden lifecycle methods like `onCreate()`?', NULL, '["super.onCreate(savedInstanceState)", "this.onCreate()", "initLifecycle()", "Activity.start()"]', 'super.onCreate(savedInstanceState)', 'Overridden lifecycle methods must invoke their superclass implementation first.');