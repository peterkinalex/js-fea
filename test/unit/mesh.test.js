/*global __dirname describe it require*/
var ROOT = __dirname + '/../..', SRC = ROOT + '/src';
var expect = require('expect.js');
var dataDriven = require('data-driven');
var mesh = require(SRC + '/mesh.js');

// FIXME: index start zero vs one madness
function addOne(x) { return x+1; }

describe('mesh', function() {
  describe('H8Block', function() {
    var H8Block = mesh.H8Block;
    var dataset = [
      {
        w: 1, l: 1, h: 1,
        nx: 1, ny: 1, nz: 1,
        desc: 'single block',
        expectedXYZ: [
          [ 0, 0, 0 ],
          [ 0, 0, 1 ],
          [ 0, 1, 0 ],
          [ 0, 1, 1 ],
          [ 1, 0, 0 ],
          [ 1, 0, 1 ],
          [ 1, 1, 0 ],
          [ 1, 1, 1 ]
        ],
        expectedConn: [
          [ 0, 4, 6, 2, 1, 5, 7, 3 ].map(addOne) // index start from 1
        ]
      },
      {
        w: 1, l: 1, h: 1,
        nx: 1, ny: 1, nz: 2,
        desc: 'two block',
        expectedXYZ: [
          [ 0, 0, 0 ],
          [ 0, 0, 0.5 ],
          [ 0, 0, 1 ],
          [ 0, 1, 0 ],
          [ 0, 1, 0.5 ],
          [ 0, 1, 1 ],
          [ 1, 0, 0 ],
          [ 1, 0, 0.5 ],
          [ 1, 0, 1 ],
          [ 1, 1, 0 ],
          [ 1, 1, 0.5 ],
          [ 1, 1, 1 ]
        ],
        expectedConn: [
          [ 0, 6, 9, 3, 1, 7, 10, 4 ].map(addOne), // index start from 1
          [ 1, 7, 10, 4, 2, 8, 11, 5 ].map(addOne) // index start from 1
        ]
      }
    ];

    dataDriven(dataset, function() {
      it('should work {desc}', function(ctx) {
        var m = H8Block(ctx.w, ctx.l, ctx.h, ctx.nx, ctx.ny, ctx.nz);
        var xyz = m.fens().xyz();
        var conn = m.gcells().conn();
        expect(xyz).to.eql(ctx.expectedXYZ);
        expect(conn).to.eql(ctx.expectedConn);
      });
    });
  });
});