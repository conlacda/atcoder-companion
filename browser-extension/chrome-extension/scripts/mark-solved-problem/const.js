const BADGE = {
    'AC': '<span class="label label-success" data-toggle="tooltip" data-placement="top" title="" data-original-title="Accepted">AC</span>',
    'WA': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Wrong Answer">WA</span>',
    'TLE': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Time Limit Exceeded">TLE</span>',
    'MLE': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Memory Limit Exceeded">MLE</span>',
    'RE': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Runtime Error">RE</span>',
    'OLE': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Output Limit Exceeded">OLE</span>',
    'IE': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Internal Error">IE</span>',
    'CE': '<span class="label label-warning" data-toggle="tooltip" data-placement="top" title="" data-original-title="Compilation Error">CE</span>',
    'WJ': '<span class="label label-default" data-toggle="tooltip" data-placement="top" title="" data-original-title="Waiting for Judging">WJ</span>',
    'JD': '<span class="label label-default" data-toggle="tooltip" data-placement="top" title="" data-original-title="Judging">_STATUS_</span>'
}

const TOOLTIP = {
    'AC': 'Accepted',
    'WA': 'Wrong Answer',
    'TLE': 'Time Limit Exceeded',
    'MLE': 'Memory Limit Exceeded',
    'RE': 'Runtime Error',
    'OLE': 'Output Limit Exceeded',
    'IE': 'Internal Error',
    'CE': 'Compile Error',
    'WJ': 'Waiting for Judging',
    'JD': 'Judging'
}
// https://atcoder.jp/contests/abc293/glossary
// https://atcoder.jp/contests/cn2016summer-practice/

const PRIORITY_LEVEL = {
    'AC': 2,
    'WA': 0,
    'TLE': 0,
    'MLE': 0,
    'RE': 0,
    'OLE': 0,
    'IE': 0,
    'CE': 0,
    'WJ': 1,
    'JD': 1
}
