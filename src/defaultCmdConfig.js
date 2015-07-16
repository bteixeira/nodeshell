var $branch = function () {
    return ['STUB-BRANCH-NAME'];
};

var $commit = function () {
    return ['STUB-COMMIT-ID'];
};

var $path = function() {
    return ['STUB-PATH'];
};



module.exports = function (completer) {

    var cfg = completer.cmdConfig;

    cfg.cd = completer.$dirName;

    cfg.git = {
        add: ['-n', '-v', '--force', '-f', '--interactive', '-i', '--patch', '-p',
            '--edit', '-e', '--all', '--no-all', '--ignore-removal', '--no-ignore-removal', '--update', '-u',
            '--intent-to-add', '-N', '--refresh', '--ignore-errors', '--ignore-missing',
            '--', '<pathspec>'],
        branch: [

            '--color', '--color=<when>', '--no-color', '-r', '-a', '--list', '-v', '--abbrev=<length>', '--no-abbrev',
            '--column', '--column=<options>', '--no-column', '--merged', '--no-merged', '--contains', '<commit>', '<pattern>',

            '--set-upstream', '--track', '--no-track', '-l', '-f', '<branchname>', '<start-point>',

            '--set-upstream-to=<upstream>', '-u <upstream>', '--unset-upstream [<branchname>]', '-m', '-M', '-d', '-D', '-r', '--edit-description'

        ],
        /* Let's try to make a real case out of checkout */
        checkout: [
            '-q', '-f', '-m', $branch, $commit,
            {'--detach': [$branch, $commit]},
            {'-b': $branch},
            {'-B': $branch},
            {'--orphan': $branch},
            '--ours', '--theirs', '--conflict=<style>',
            {'--': $path},
            '-p', '--patch'

        ],
        clone: [],
        commit: [],
        diff: [],
        fetch: [],
        grep: [],
        init: [],
        log: [],
        merge: [],
        mv: [],
        pull: [],
        push: [],
        rebase: [],
        reset: [],
        rm: [],
        show: [],
        status: [],
        help: ['add', 'branch', 'checkout', 'clone', 'commit', 'diff', 'fetch',
            'grep',
            'init',
            'log',
            'merge',
            'mv',
            'pull',
            'push',
            'rebase',
            'reset',
            'rm',
            'show',
            'status']
    };

};
