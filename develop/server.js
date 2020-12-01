const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "12345",
    database: "employeetracker"
});

connection.connect(err => {
    if (err) {
        throw err;
    } else {
        console.log(`Connected as ID: ${connection.threadId}`);
        startMenu();
    }
});

function startMenu() {
    inquirer.prompt([
        {
        type: "list",
        name: "begin",
        message: "Employee Tracker | How would you like to start?",
        choices: 
        ["View Employees", "View Departments", "View Roles", "Add Employee",  "Remove Employee", "Add Role",  "Update Role", "Add Department", "Quit"]
        }
    ]).then(answers => {
        switch (answers.begin) {
            case "View Employees":
                viewEmployees();
                break;
            case "View Departments":
                viewDepartments();
                break;
            case "View Roles":
                viewRoles();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Update Role":
                updateRole();
                break;
            case "Quit":
                console.log("Exited")
                connection.end();
        }
    });
}

//View existing employee list
function viewEmployees() {
    connection.query(

        "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id;"
        
        , (err, res) => {
        if (err) {
            throw err;
        } else {
            console.table(res);
            startMenu();
        }
    });
}

//View all departments
function viewDepartments(){
    connection.query(
        "SELECT department.id, department.name, SUM(role.salary) AS utilized_budget FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id GROUP BY department.id, department.name;"
    , function(err, res){
      if (err) {
        throw err 
        } else {
          console.table(res);
          startMenu();
        }
    });
}

//View all roles
function viewRoles() {
    connection.query(
        "SELECT role.id, role.title, department.name AS department, role.salary FROM role LEFT JOIN department on role.department_id = department.id;"
        , (err, res) => {
        if (err) {
            throw err;
        } else {
            console.table(res);
            startMenu();
        }
    });
}

//Adding employee prompt
function addEmployee() {
    connection.query("SELECT title FROM role", (err, res) => {
        let roles = [];
        for(var i = 0; i < res.length; i++) {
            roles.push(res[i].title);
        }

        inquirer.prompt([
            {
                type: "input",
                name: "firstName",
                message: "Enter their first name: "
            },
            {
                type: "input",
                name: "lastName",
                message: "Enter their last name: "
            },
            {
                type: "list",
                name: "role",
                message: "Enter their role: ",
                choices: roles
            }
        ]).then(userInput => {
            const index = roles.indexOf(userInput.role) + 1;
            connection.query("INSERT INTO employee SET ?",
            {
                first_name: userInput.firstName,
                last_name: userInput.lastName,
                role_id: index,
            },
            function(err, res){
                if (err) {
                    throw err;
                } else {
                    console.log("Employee was added")
                    startMenu();
                }
            });
        });
    });

}

//Add role prompt
function addRole() {
    inquirer.prompt([
        {
            type: "input",
            name: "Title",
            message: "Please enter the title of the position."
        },
        {
            name: "Salary",
            type: "input",
            message: "Please enter the salary for this role."
        },
        {
            name: "DepartmentID",
            type: "input",
            message: "What is the department id for this role?",
            choices: [
            "Sales",
            "Finance",
            "Engineering",
            "Legal"
            ]
        }
      ]).then((userInput) => {
      connection.query("INSERT INTO role SET ?", 
        { 
        title: userInput.Title, 
        salary: userInput.Salary, 
        department_id: userInput.DepartmentID
        }, 
        function(err, res) {
        if (err) {
            throw err;
        } else {
            console.log("New role added!");
            console.table(userInput); 
            startMenu();
        }
      });
    });
}

//Add Department prompt
function addDepartment() {
    inquirer.prompt({
        type: "input",
        name: "Department",
        message: "Please enter the department name you would like to add."
    }).then(userInput => {
        connection.query(
        "INSERT INTO department SET ?"
        , 
        {
            name: userInput.Department
        }, 
        function(err, res){
            if(err) {
                throw err;
            } else {
                console.log("Department added!");
                console.table(userInput);
                startMenu();
            }
        });
    });
}


// Function to UPDATE employee role
function updateRole() {
connection.query("SELECT id, first_name, last_name FROM employee", (err, res) => {
    connection.query("SELECT * FROM employee_db.role;", (err1, res1) => {
    let empArr = [];
    let roleArr = [];
    for(var i = 0; i < res.length; i++) {
        empArr.push({ value: parseInt(res[i].id), name: res[i].first_name + " " + res[i].last_name });
    }
    for(var i = 0; i < res1.length; i++) {
        roleArr.push({ value: parseInt(res1[i].id), name: res1[i].title });
    }

    inquirer.prompt([
        {
            type: "list",
            name: "emp",
            message: "Which employee would you like to update?",
            choices: empArr
        },
        {
            type: "list",
            name: "role",
            message: "Please specify the role you would like this employee to have.",
            choices: roleArr
        }
    ]).then(userInput => {
        connection.query("UPDATE employee SET ? WHERE ?",
        [{
            role_id: userInput.role
        },
        {
            id: userInput.emp
        }], startMenu)
    })})
}
)};

