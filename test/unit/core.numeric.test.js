/*jshint undef: true, unused: true */
/*global __dirname describe it require*/
var ROOT = __dirname + '/../..', SRC = ROOT + '/src';
var expect = require('expect.js');
var _ = require(SRC + '/core.utils.js');
var numeric = require(SRC + '/core.numeric');
var DokSparseMatrix = numeric.DokSparseMatrix;
var SparseVector = numeric.SparseVector;
var ccsValueListIterator = numeric.ccsValueListIterator;

describe('core.numeric', function() {

  describe('ccsValueListIterator()', function() {

    it('should emit correct sequence', function() {
      var full = [
        [ 0, 1, 0 ],
        [ 1, 2, 0 ],
        [ 0, 1, 1 ]
      ];

      var ccs = numeric.ccsSparse(full);

      var expectedValueList = [
        [ 1, 0, 1 ],
        [ 0, 1, 1 ],
        [ 1, 1, 2 ],
        [ 2, 1, 1 ],
        [ 2, 2, 1 ]
      ];

      var iter = ccsValueListIterator(ccs);
      var valueList = _.listFromIterator(iter);

      expect(valueList).to.eql(expectedValueList);
    });

  });

  describe('DokSparseMatrix', function() {
    describe('DokSparseMatrix basic operations', function() {

      var dsm, m = 3, n = 4;
      var valueLst = [
        [0, 0, 1.0],
        [0, 1, 2.0],
        [1, 1, 1.0],
        [1, 2, 2.0],
        [2, 1, 1.0],
        [2, 2, 1.0],
        [2, 3, 1.0]
      ];
      var expectedFullMatrix = [
        [1.0, 2.0, 0.0, 0.0],
        [0.0, 1.0, 2.0, 0.0],
        [0.0, 1.0, 1.0, 1.0]
      ];

      var expectedCcsMatrix = [
        [0, 1, 4, 6, 7],
        [0, 0, 1, 2, 1, 2, 2],
        [1.0, 2.0, 1.0, 1.0, 2.0, 1.0, 1.0]
      ];

      it('#constructor(lst, m, n)', function() {
        dsm = new DokSparseMatrix(valueLst, m, n);
        expect(dsm.m()).to.be(3);
        expect(dsm.n()).to.be(4);
      });

      it('#at(i, j)', function() {
        var i, j;
        for (i = 0; i < m; ++i)
          for (j = 0; j < n; ++j)
            expect(dsm.at(i, j)).to.be(expectedFullMatrix[i][j]);

        expect(dsm.at.bind(dsm, m, 0)).to.throwException();
        expect(dsm.at.bind(dsm, -1, 0)).to.throwException();
        expect(dsm.at.bind(dsm, 0, -1)).to.throwException();
        expect(dsm.at.bind(dsm, 0, n)).to.throwException();
      });

      it('#set_(i, j, val)', function() {
        var i, j, val;
        var newMat = _.array2d(m, n, function(i, j) { return i + j; });
        for (i = 0; i < m; ++i)
          for (j = 0; j < n; ++j)
            dsm.set_(i, j, newMat[i][j]);

        expect(dsm.set_.bind(dsm, m, 0, 1.0)).to.throwException();
        expect(dsm.set_.bind(dsm, -1, 0, 1.0)).to.throwException();
        expect(dsm.set_.bind(dsm, 0, -1, 1.0)).to.throwException();
        expect(dsm.set_.bind(dsm, 0, n, 1.0)).to.throwException();
        expect(dsm.toFull()).to.eql(newMat);
      });

      it('#toFull()', function() {
        var m1 = new DokSparseMatrix(valueLst, m, n);
        expect(m1.toFull()).to.eql(expectedFullMatrix);

        var m2 = new DokSparseMatrix([
          [0, 1, 1],
          [2, 1, 1],
          [2, 2, 1]
        ], 3, 3);
        expect(m2.toFull()).to.eql([
          [0, 1, 0],
          [0, 0, 0],
          [0, 1, 1]
        ]);

      });

      it('#toCcs()', function() {
        var m1 = new DokSparseMatrix(valueLst, m, n);
        expect(m1.toCcs()).to.eql(expectedCcsMatrix);

        var m2 = new DokSparseMatrix([
          [0, 1, 1],
          [2, 1, 1],
          [2, 2, 1]
        ], 3, 3);
        expect(m2.toCcs()).to.eql([
          [0, 0, 2, 3],
          [0, 2, 2],
          [1, 1, 1]
        ]);
      });


      it('DokSparseMatrix::toValueList(), should return correct value list consist of tuple (rowIndex, colIndex, value)', function() {
        var m1 = new DokSparseMatrix([
          [1, 1, 2],
          [2, 2, 5],
          [0, 0, 2]
        ], 4, 3);
        expect(m1.toValueList().sort(_.byLexical)).to.eql([
          [0, 0, 2],
          [1, 1, 2],
          [2, 2, 5]
        ]);

        expect((new DokSparseMatrix([], 3, 3)).toValueList()).to.eql([]);

      });

    });

    describe('DokSparseMatrix::solveSparseVector(vec)/solveVector(vec)', function() {
      it('should throw error if the vec is not a SparseVector.', function() {
        var m = new DokSparseMatrix([], 3, 2);
        expect(m.solveSparseVector.bind(m, [1, 2])).to.throwException();
      });

      it('should throw error if the sparse vector dimension does not match matrix dimension.', function() {
        var A = new DokSparseMatrix([], 3, 3);
        var b = new SparseVector([], 2);
        expect(A.solveSparseVector.bind(A, b)).to.throwException();
      });

      it('should return correct result for eye(3)', function() {
        var A = new DokSparseMatrix([
          [0, 0, 1.0],
          [1, 1, 1.0],
          [2, 2, 1.0]
        ], 3, 3), b1 = [1.0, 2.0, 3.0];
        var b2 = new SparseVector([
          [0, 1.0],
          [1, 2.0],
          [2, 3.0]
        ], 3);

        var x1 = A.solveVector(b1);
        expect(x1).to.eql(b1);

        var x2 = A.solveSparseVector(b2);
        expect(x2.toCcs()).to.eql(b2.toCcs());
      });

      it('should return correct result for conceived A and b, b is an array', function() {
        var A = new DokSparseMatrix([

          [0, 0, 1.0],
          [0, 1, 2.0],
          [0, 2, 3.0],

          [1, 0, 6.0],
          [1, 1, 5.0],
          [1, 2, 4.0],

          [2, 0, 7.0],
          [2, 1, 10.0],
          [2, 2, 4.0]

        ], 3, 3);
        var b1 = [5.0, 9.0, 5.0];
        var b2 = [ [5.0], [9.0], [5.0] ];

        var xExpected = [1.0, -1.0, 2.0];
        var x1 = A.solveVector(b1);
        // var x2 = A.solveVector(b2);
        var relDiff1 = numeric.norm2(numeric.sub(x1, xExpected)) / numeric.norm2(xExpected);
        // var relDiff2 = numeric.norm2(numeric.sub(x2, xExpected)) / numeric.norm2(xExpected);
        var tol = 1e-10;

        expect(relDiff1).to.lessThan(tol);
        // expect(relDiff2).to.lessThan(tol);
      });

      it('should return correct result for conceived A and b, b is a SparseVector', function() {
        var A = new DokSparseMatrix([

          [0, 0, 1.0],
          [0, 1, 2.0],
          [0, 2, 3.0],

          [1, 0, 6.0],
          [1, 1, 5.0],
          [1, 2, 4.0],

          [2, 0, 7.0],
          [2, 1, 10.0],
          [2, 2, 4.0]

        ], 3, 3);
        var b = new SparseVector([
          [0, 5.0], [1, 9.0], [2, 5.0]
        ], 3);

        var xExpected = [1.0, -1.0, 2.0];
        var x = A.solveSparseVector(b);
        x = numeric.transpose(x.toFull())[0];

        var relDiff = numeric.norm2(numeric.sub(x, xExpected)) / numeric.norm2(xExpected);
        var tol = 1e-10;
        expect(relDiff).to.lessThan(tol);
      });

    });


  });

  describe('SparseVector', function() {
    var f = function(a, b) { return new SparseVector(a, b); };
    var v0, v1, v2;

    it('SparseVector(valueList, dim)', function() {
      v0 = new SparseVector([], 10);
      v1 = new SparseVector([
        [5, 2],
        [2, 2],
        [60, 8]
      ], 1000);
      v2 = new SparseVector([ [0, 1], [1, 2], [2, 3] ], 3);

      expect(f.bind(null, [ [0, 1], [2, 3] ])).to.throwException();
    });

    it('SparseVector::at(i)/length()/nzCount()', function() {
      expect(v0.length()).to.be(10);
      expect(v0.nzCount()).to.be(0);
      expect(v0.at(0)).to.be(0);
      expect(v0.at(2)).to.be(0);
      expect(v0.at.bind(v0, -1)).to.throwException();
      expect(v0.at.bind(v0, 10)).to.throwException();

      expect(v1.length()).to.be(1000);
      expect(v1.nzCount()).to.be(3);
      expect(v1.at(0)).to.be(0);
      expect(v1.at(5)).to.be(2);
      expect(v1.at(60)).to.be(8);
      expect(v1.at.bind(v1, 1000)).to.throwException();

      expect(v2.length()).to.be(3);
      expect(v2.nzCount()).to.be(3);
      expect(v2.at(0)).to.be(1);
      expect(v2.at(1)).to.be(2);
      expect(v2.at(2)).to.be(3);
      expect(v2.at.bind(null, 3)).to.throwException();
    });

    it('SparseVector::set_(i, val)', function() {
      var v = new SparseVector([ [0, 0], [3, 3] ], 5);
      expect(v.set_.bind(v, -1)).to.throwException();
      expect(v.set_.bind(v, 10)).to.throwException();

      v.set_(0, 2);
      expect(v.at(0)).to.be(2);

      expect(v.at(1)).to.be(0);
      v.set_(1, 5);
      expect(v.at(1)).to.be(5);

      expect(v.set_.bind(v, 1, 'sdf')).to.throwException();
    });

    it('SparseVector::toFull()/toList()/toCcs()', function() {
      var v1 = new SparseVector([ [0, 0], [3, 3] ], 5);
      expect(v1.toFull()).to.eql([ [0], [0], [0], [3], [0] ]);
      expect(v1.toList()).to.eql([ 0, 0, 0, 3, 0 ]);
      expect(v1.toCcs()).to.eql([
        [0, 1],
        [3],
        [3]
      ]);
    });


  });


  xdescribe('#assembly()', function() {



  });

});