const inquirer = require("inquirer");
const fs = require("fs");
const server = require("./server");

// Create an array of questions for user input
const questions = [
  {
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View All Employee",
      "Add Employee",
      "Update Employee Role",
      "View All Roles",
      "Add Role",
      "View All Departments",
      "Add Department",
      "Update Employee Manager",
      "View Employees by Manager",
      "View Employees by Department",
      "Delete Department",
      "Delete Roles",
      "Delete Employees",
      "View the total utilized budget",
      "Quit",
    ],
    name: "Initial",
  },
];

// Create a function to initialize app
function init() {
  inquirer.prompt(questions).then((data) => {
    if (data.Initial === "Add Employee") {
      addEmployee();
    } else if (data.Initial === "View All Employee") {
      viewAllEmployee();
    } else if (data.Initial === "Update Employee Role") {
      updateEmployeeRole();
    } else if (data.Initial === "View All Roles") {
      viewAllRoles();
    } else if (data.Initial === "Add Role") {
      addRole();
    } else if (data.Initial === "View All Departments") {
      viewAllDepartments();
    } else if (data.Initial === "Add Department") {
      addDepartment();
    } else if (data.Initial === "Update Employee Manager") {
      updateEmployeeManager();
    } else if (data.Initial === "View Employees by Manager") {
      viewEmployeesByManager();
    } else if (data.Initial === "View Employees by Department") {
      viewEmployeesByDepartment();
    } else if (data.Initial === "Delete Department") {
      deleteDepartment();
    } else if (data.Initial === "Delete Roles") {
      deleteRoles();
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
    const [rolesWithDepartments] = await server.promise().query(`
        SELECT role.id, role.title, department.department_name AS department_name
        FROM role
        INNER JOIN department ON role.department_id = department.id
      `);

    console.table(rolesWithDepartments);
    setTimeout(init, 3000);
  } catch (error) {
    console.log(error);
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

// finish adding role
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

// view departments
const viewAllDepartments = async () => {
  const [department] = await server
    .promise()
    .query(
      "SELECT department.id AS id, department.department_name AS department FROM department"
    );
  console.table(department);
  setTimeout(init, 3000);
};

// add department
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

// update employee's manager
const updateEmployeeManager = async () => {
  try {
    const [employee] = await server
      .promise()
      .query(
        `SELECT employees.manager_id, employees.id, employees.first_name, employees.last_name, role.title AS role, CONCAT(employees.first_name, ' ', employees.last_name) as employee FROM employees JOIN role ON employees.role_id = role.id`
      );

    const newRole = employee.map((role) => ({
      name: role.employee,
      title: role.role,
      manager: role.manager_id,
    }));

    const employeeName = await inquirer.prompt([
      {
        name: "chosenEmployee",
        type: "list",
        message: "Please choose an employee.",
        choices: newRole,
      },
    ]);

    const [manager] = await server
      .promise()
      .query(
        "SELECT employees.manager_id, CONCAT(employees.first_name, ' ', employees.last_name) as Manager FROM employees"
      );

    const newManager = manager.map((role) => ({
      name: role.Manager,
      manager: role.manager_id,
    }));

    const managerName = await inquirer.prompt([
      {
        name: "chosenManager",
        type: "list",
        message: "Please choose the employee's manager.",
        choices: newManager,
      },
    ]);

    await server
      .promise()
      .query(`UPDATE employees SET manager_id = ? WHERE id = ?`, [
        managerName,
        employeeName,
      ]);

    console.log("Employee manager updated successfully.");
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// view employees by manager
const viewEmployeesByManager = async () => {
  try {
    const [managerList] = await server
      .promise()
      .query(
        "SELECT employees.id, employees.first_name, employees.last_name, role.title AS role, CONCAT(manager.first_name, ' ', manager.last_name) as manager FROM employees LEFT JOIN role ON employees.role_id = role.id LEFT JOIN employees manager ON employees.manager_id = manager.id"
      );

    const list = managerList.map((role) => ({
      name: role.manager,
      manager: role.manager_id,
    }));
    const listOfManagers = await inquirer.prompt([
      {
        name: "listManager",
        type: "list",
        message: "Please choose the manager.",
        choices: list,
      },
    ]);
    console.table(listOfManagers);
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

const viewEmployeesByDepartment = async () => {
  try {
    const [employees] = await server
      .promise()
      .query(
        "SELECT employees.first_name, employees.last_name, CONCAT(employees.first_name, ' ', employees.last_name) as employee_name, department.name AS departmentName FROM department JOIN role ON employees.role_id = role.id JOIN department ON role.department_id = department.id"
      );

    const employeeList = employees.map((employee) => ({
      departmentName: employee.departmentName,
      employeeName: employee.employee_name,
    }));

    const listOfEmployees = await inquirer.prompt([
      {
        name: "listEmployees",
        type: "list",
        message: "Please choose the department.",
        choices: employeeList,
      },
    ]);

    console.table(listOfEmployees);
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// delete selected department
const deleteDepartment = async () => {
  try {
    const chooseDepartmentQuery = "SELECT id, department_name FROM department";
    const [chosenDepartment] = await server
      .promise()
      .query(chooseDepartmentQuery);

    const departmentList = chosenDepartment.map((department) => ({
      id: department.id,
      departmentName: department.department_name,
    }));

    const department = departmentList.map(
      (department) => department.departmentName
    );

    const { departmentId } = await inquirer.prompt([
      {
        name: "departmentId",
        type: "list",
        message: "Please choose the department to delete:",
        choices: department,
      },
    ]);

    const selectedDepartment = departmentList.find(
      (dept) => dept.departmentName === departmentId
    );

    if (selectedDepartment) {
      const deleteDepartmentQuery = `DELETE FROM department WHERE id = ?`;
      await server
        .promise()
        .query(deleteDepartmentQuery, [selectedDepartment.id]);

      console.log("Department has been deleted");
      viewAllRoles();
      setTimeout(init, 3000);
    } else {
      console.log("Department not found. Please select a valid department.");
    }
  } catch (error) {
    console.error(error);
  }
};

const deleteRoles = async () => {
  const roleToDeleteQuery = "SELECT role.title, role.id FROM role";
  const [chosenDelete] = await server.promise().query(roleToDeleteQuery);

  const toDelete = chosenDelete.map((role) => ({
    title: role.title,
    id: role.id,
  }));

  const deleteRole = toDelete.map((role) => role.title);

  const { roleId } = await inquirer.prompt([
    {
      name: "roleId",
      type: "list",
      message: "Please choose the role to delete:",
      choices: deleteRole,
    },
  ]);

  const selectedRole = chosenDelete.find((role) => role.id === roleId);

  if (selectedRole) {
    const deleteRoleQuery = "DELETE FROM role WHERE id = ?";
    await server.promise().query(deleteRoleQuery, [selectedRole.id]);

    console.log("Role has been deleted");
    // Call the appropriate functions here
  } else {
    console.log("Role not found. Please select a valid role.");
  }
};
// Function call to initialize app
init();
