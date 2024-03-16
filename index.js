const inquirer = require("inquirer");
const fs = require("fs");
const server = require("./server");

// TODO: Create an array of questions for user input
const questions = [
  {
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View All Employee",
      "Add Employee",
      "Update Employee Role",
      "View all roles",
      "Add Role",
      "View All Departments",
      "Add Department",
      "Update Employee Manager",
      "View Employees by Manager",
      "View employees by department",
      "Delete Department",
      "Delete Roles",
      "Delete Employees",
      "View the total utilized budget",
      "Quit",
    ],
    name: "Initial",
  },
];

// TODO: Create a function to initialize app
function init() {
  inquirer.prompt(questions).then((data) => {
    if (data.Initial === "Add Employee") {
      addEmployee();
    } else if (data.Initial === "View All Employee") {
      viewAllEmployee();
    } else if (data.Initial === "Update Employee Role") {
      updateEmployeeRole();
    } else if (data.Initial === "View all roles") {
      viewAllRoles();
    } else if (data.Initial === "Add Role") {
      addRole();
    } else if (data.Initial === "View All Departments") {
      viewAllDepartments();
    } else if (data.Initial === "Add Department") {
      addDepartment();
    } else if (data.Initial === "Quit") {
      server.end();
    }
  });
}

// view all employees
const viewAllEmployee = async () => {
  const [employees] = await server
    .promise()
    .query(
      "SELECT employees.id, employees.first_name, employees.last_name, role.title AS role, CONCAT(manager.first_name, ' ', manager.last_name) as manager FROM employees LEFT JOIN role ON employees.role_id = role.id LEFT JOIN employees manager ON employees.manager_id = manager.id"
    );

  console.table(employees);
  setTimeout(init, 3000);
};

// add employee
const addEmployee = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "firstName",
        message: "What is the employee's first name?",
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
      },
    ]);

    const crit = [answer.firstName, answer.lastName];
    const roleSql = `SELECT role.id, role.title FROM role`;
    const [roleChoice] = await server.promise().query(roleSql);

    const roles = roleChoice.map(({ id, title }) => ({
      name: title,
      value: id,
    }));
    const { role } = await inquirer.prompt([
      {
        type: "list",
        name: "role",
        message: "What is the employee's role?",
        choices: roles,
      },
    ]);

    crit.push(role);
    const managerSql = `SELECT * FROM employees`;
    const [managersData] = await server.promise().query(managerSql);

    const managers = managersData.map(({ id, first_name, last_name }) => ({
      name: first_name + " " + last_name,
      value: id,
    }));
    const { manager } = await inquirer.prompt([
      {
        type: "list",
        name: "manager",
        message: "What is the employee's manager?",
        choices: managers,
      },
    ]);

    crit.push(manager);
    const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
            VALUES (?, ?, ?, ?)`;
    await server.promise().query(sql, crit);
    console.log("Employee has been added");
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// update employee role

const updateEmployeeRole = async () => {
  try {
    const employeeSql =
      "SELECT employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS full_name FROM employees";
    const [chosenEmployee] = await server.promise().query(employeeSql);
    const employeeChoices = chosenEmployee.map((emp) => ({
      name: emp.full_name,
      value: emp.id,
    }));

    const roleSql = "SELECT role.id, role.title FROM role";
    const [roles] = await server.promise().query(roleSql);
    const roleChoices = roles.map((role) => ({
      name: role.title,
      value: role.id,
    }));

    const answers = await inquirer.prompt([
      {
        name: "chosenEmployee",
        type: "list",
        message: "Which employee has a new role?",
        choices: employeeChoices,
      },
      {
        name: "chosenRole",
        type: "list",
        message: "What is their new role?",
        choices: roleChoices,
      },
    ]);

    await server
      .promise()
      .query("UPDATE employees SET role_id = ? WHERE id = ?", [
        answers.chosenRole,
        answers.chosenEmployee,
      ]);

    console.log("Employee role updated successfully.");
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// view all roles
const viewAllRoles = async () => {
  try {
    const [role] = await server
      .promise()
      .query(
        "SELECT role.id, employees.first_name, employees.last_name, role.title AS title FROM employees INNER JOIN role ON employees.role_id = role.id"
      );

    console.table(role);
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// add role
const addRole = async () => {
  try {
    const [deptNames] = await server
      .promise()
      .query("SELECT department.department_name AS department FROM department");

    const choices = deptNames.map((dept) => dept.department);

    const answer = await inquirer.prompt([
      {
        name: "departmentName",
        type: "list",
        message: "Which department is this new role in?",
        choices: choices,
      },
    ]);

    if (answer.departmentName === "") {
      addDepartment();
    } else {
      await addRoleResume(answer);
    }
  } catch (error) {
    console.log("Error adding role:", error);
  }
};

const addRoleResume = async () => {
  try {
    const { newRole, salary } = await inquirer.prompt([
      {
        name: "newRole",
        type: "input",
        message: "What is the name of your new role?",
      },
      {
        name: "salary",
        type: "input",
        message: "What is the salary of this new role?",
      },
    ]);

    const [role] = await server
      .promise()
      .query(
        "UPDATE employees JOIN role ON employees.role_id = role.id SET role.title = 'newRole', role.salary = salary WHERE role.id = employees.role_id;"
      );
    viewAllRoles();
    setTimeout(init, 3000);
    // Add the new role to the database using departmentId, newRole, and salary
  } catch (error) {
    console.log(error);
  }
};

const viewAllDepartments = async () => {
  const [department] = await server
    .promise()
    .query(
      "SELECT department.id AS id, department.department_name AS department FROM department"
    );
  console.table(department);
  setTimeout(init, 3000);
};

const addDepartment = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        name: "newDepartment",
        type: "input",
        message: "What is the name of your new Department?",
      },
    ]);

    let sql = `INSERT INTO department (department_name) VALUES (?)`;
    await server.promise().query(sql, [answer.newDepartment]);

    console.log("Department has been added");
    viewAllDepartments();
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};
// Function call to initialize app
init();
