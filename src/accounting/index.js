const readline = require('node:readline');

const storage = {
  balance: 1000.00,
};

function readBalance() {
  return storage.balance;
}

function writeBalance(balance) {
  storage.balance = balance;
}

function formatBalance(balance) {
  return balance.toFixed(2);
}

function showBalance() {
  console.log(`Current balance: ${formatBalance(readBalance())}`);
}

function creditAccount(amount) {
  const balance = readBalance() + amount;
  writeBalance(balance);
  console.log(`Amount credited. New balance: ${formatBalance(balance)}`);
}

function debitAccount(amount) {
  const balance = readBalance();

  if (balance >= amount) {
    const newBalance = balance - amount;
    writeBalance(newBalance);
    console.log(`Amount debited. New balance: ${formatBalance(newBalance)}`);
    return;
  }

  console.log('Insufficient funds for this debit.');
}

function displayMenu() {
  console.log('--------------------------------');
  console.log('Account Management System');
  console.log('1. View Balance');
  console.log('2. Credit Account');
  console.log('3. Debit Account');
  console.log('4. Exit');
  console.log('--------------------------------');
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askForAmount(interface, operation) {
  interface.question(`Enter ${operation} amount: `, (input) => {
    const amount = Number(input);

    if (!Number.isFinite(amount) || amount < 0) {
      console.log('Invalid amount, please enter a non-negative number.');
      runMenu(interface);
      return;
    }

    if (operation === 'credit') {
      creditAccount(amount);
    } else {
      debitAccount(amount);
    }

    runMenu(interface);
  });
}

function runMenu(interface) {
  displayMenu();
  interface.question('Enter your choice (1-4): ', (choice) => {
    switch (choice.trim()) {
      case '1':
        showBalance();
        runMenu(interface);
        break;
      case '2':
        askForAmount(interface, 'credit');
        break;
      case '3':
        askForAmount(interface, 'debit');
        break;
      case '4':
        console.log('Exiting the program. Goodbye!');
        interface.close();
        break;
      default:
        console.log('Invalid choice, please select 1-4.');
        runMenu(interface);
    }
  });
}

if (require.main === module) {
  runMenu(createInterface());
}

module.exports = {
  creditAccount,
  debitAccount,
  readBalance,
  writeBalance,
};
