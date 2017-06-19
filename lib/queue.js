const chalk = require('chalk');

const queue = [];
let vorpal;
let workTimer;

const setup = (mainVorpal) => vorpal = mainVorpal;

const addToQueue = (data) => {
    if (!data.timeout || !data.tries || !data.type || !data.onWork || !data.onCancel) {
        throw new Error('Bad queue data.');
    }

    data.attempts = 0;
    data.message = '';
    data.status = 'pending';
    data.timestamp = Date.now();

    queue.push(data);

    vorpal.log(chalk.green(`Added a ${data.type} transaction to the queue.  To view the status of the queue, use the 'queue' command.\n`));
    setTimeout(workTheQueue, 0);
    return queue.length - 1;
};

const workTheQueue = () => {
    let index = null;
    for (let i = 0; i < queue.length; i += 1) {
        const transaction = queue[i];
        if (transaction.status === 'working') {
            return;
        }

        if (transaction.status === 'pending' && transaction.tries > 0) {
            index = i;
            break;
        }
    }

    if (index === null) {
        return;
    }

    queue[index].status = 'working';
    queue[index].tries -= 1;
    queue[index].attempts += 1;
    queue[index].attemptStart = Date.now();

    // If the task fails, this is what we do.
    const cancel = (message) => {
        queue[index].onCancel(() => {
            if (message) {
                queue[index].message = message;
            }
            if (queue[index].tries === 0) {
                queue[index].status = 'failed';
            } else {
                queue[index].status = 'pending';
            }
            setTimeout(workTheQueue, 0);
        });
    };

    workTimer = setTimeout(cancel, queue[index].timeout);

    queue[index].onWork()
    .then((message) => {
        clearTimeout(workTimer);
        queue[index].status = 'success';
        if (message) {
            queue[index].message = message;
        }

        vorpal.log(chalk.green(`Your pending transaction completed.  ${message}`));

        setTimeout(workTheQueue, 0);
    })
    .catch(cancel);
}

module.exports = {
    addToQueue,
    data: queue,
    setup
};
