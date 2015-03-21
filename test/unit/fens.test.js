/*global __dirname describe it require*/
var ROOT = __dirname + '/../..', SRC = ROOT + '/src';
var expect = require('expect.js');
var fens = require(SRC + '/fens.js');
var ModuleTester = require(ROOT + '/test/lib/module-tester').ModuleTester;

describe('fens', function() {

  var dataset = [
    {
      _type: 'FeNodeSet',
      _init_params: [
        [
          [0, 0],
          [0, 40]
        ]
      ],
      _exception: true,
      _desc: 'option should be a object.'
    },
    {
      _type: 'FeNodeSet',
      _init_params: [
        {
          xyz: [
            [0, 0],
            [0, 40],
            [40, 0],
            [40, 40],
            [80, 0],
            [80, 40]
          ]
        }
      ],
      xyz: [
        {
          output: [
            [0, 0],
            [0, 40],
            [40, 0],
            [40, 40],
            [80, 0],
            [80, 40]
          ],
          verify: 'eql'
        }
      ],
      xyzById: [
        { input: [0], exception: true, desc: 'id out of range.' },
        { input: [1], output: [0, 0], verify: 'eql' },
        { input: [4], output: [40, 40], verify: 'eql' },
      ],
      xyzIter: [
        {
          output: [
            [0, 0],
            [0, 40],
            [40, 0],
            [40, 40],
            [80, 0],
            [80, 40]
          ],
          verify: 'iter'
        }
      ],
      nfens: [ { output: 6 } ],
      count: [ { output: 6 } ],
      xyz3: [
        {
          output: [
            [0, 0, 0],
            [0, 40, 0],
            [40, 0, 0],
            [40, 40, 0],
            [80, 0, 0],
            [80, 40, 0]
          ],
          verify: 'eql'
        }
      ],
      xyz3ById: [
        { input: [0], exception: true, desc: 'id out of range.' },
        { input: [1], output: [0, 0, 0], verify: 'eql' },
        { input: [4], output: [40, 40, 0], verify: 'eql' }
      ],
      xyz3Iter: [
        {
          output: [
            [0, 0, 0],
            [0, 40, 0],
            [40, 0, 0],
            [40, 40, 0],
            [80, 0, 0],
            [80, 40, 0]
          ],
          verify: 'iter'
        }
      ],
      boxSelect: [
        {
          input: [
            {
              bounds: [0, 0, -Infinity, +Infinity],
              inflate: 1e-4
            }
          ],
          output: [1, 2],
          verify: 'eql'
        },
        {
          input: [
            {
              bounds: [80-2, 80+2, 40-2, 40+2]
            }
          ],
          output: [6],
          verify: 'eql'
        }
      ],
      embed: [
        {
          input: 3,
          output: [
            [0, 0, 0],
            [0, 40, 0],
            [40, 0, 0],
            [40, 40, 0],
            [80, 0, 0],
            [80, 40, 0]
          ],
          verify: 'fensEql'
        }
      ]
    }
  ];

  var verifies = {
    iter: function(iter, expected) {
      var arr  = [];
      while (iter.hasNext()) arr.push(iter.next());
      expect(arr).to.eql(expected);
    },
    fensEql: function(fens, expected) {
      expect(fens.xyz()).to.eql(expected);
    }
  };


  var tester = new ModuleTester(fens, dataset, verifies);
  tester.run();
});
