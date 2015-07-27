var cp = require('child_process');

var $branch = function (cmd, args, prefix) {
    //return ['STUB-BRANCH-NAME'];
    try {
        // TODO THIS RELIES ON BASH SYNTAX AND IS NOT CROSS PLATFORM
        var branches = cp.execSync('git for-each-ref "refs/heads/' + prefix + '*" "--format=%(refname:short)"', {cwd: process.cwd()});
        return branches.toString().trim().split('\n');
    } catch (ex) {
        console.log(ex);
    }
};

var $commit = function () {
    //return ['STUB-COMMIT-ID'];
    return [];
};

var $path = function() {
    //return ['STUB-PATH'];
    return [];
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
            '-q',
            '-f',
            '-m',
            $branch,
            $commit,
            {'--detach': [$branch, $commit]},
            {'-b': $branch},
            {'-B': $branch},
            {'--orphan': $branch},
            '--ours', '--theirs', '--conflict=<style>',
            {'--': $path},
            '-p', '--patch'
        ],
        clone: [],
        commit: [
            '-a',
            '--interactive',
            '--patch',
            '-s',
            '-v',
            '-u',
            '--amend',
            '--dry-run',
            '-c',
            '-C',
            '--fixup',
            '--squash',
            {'-F': completer.$fileName},
            '-m',
            '--reset-author',
            '--allow-empty',
            '--allow-empty-message',
            '--no-verify',
            '-e',
            '--author=',
            '--date=',
            '--cleanup=',
            '--status',
            '--no-status',
            '-i',
            '-o',
            '-S',
            {'--': completer.$fileName},
            completer.$fileName
        ],
        diff: [],
        fetch: [],
        grep: [],
        init: [],
        log: [],
        merge: [
                '--abort', '-n', '--stat', '--no-commit', '--squash', '--edit', '--no-edit', {'strategy': '$strategy'},
                {'-X': '$strategyOptions'}, '-S', '--rerere-autoupdate', '--no-rerere-autoupdate', '-m', '$commit', 'HEAD'
            ],
        mv: [],
        pull: [],
        push: [],
        rebase: [],
        reset: [],
        rm: [],
        show: [],
        stash: {
            list: '$logOptions',
            show: '$stash',
            drop: ['-q', '--quiet', '$stash'],
            pop: ['-q', '--quiet', '$stash', '--index'],
            apply: ['-q', '--quiet', '$stash', '--index'],
            branch: ['$branch', '$stash'],
            save: ['-p', '--patch', '-k', '--keep-index', '--no-keep-index', '-q', '--quiet', '-u', '--include-untracked', '-a', '--all'],
            clear: [],
            create: [],
            store: ['-m', '--message', '-q', '--quiet', '$commit']
        },
        status: [],
        help: [
            'add',
            'branch',
            'checkout',
            'clone',
            'commit',
            'diff',
            'fetch',
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

    /**
     * Ruby on Rails
     */
    cfg.rails = {
        generate: [],
        console: [],
        server: [],
        dbconsole: [],
        'new': [],
        application: [],
        destroy: [],
        plugin: 'new',
        runner: []
    };
};
