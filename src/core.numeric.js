/*global require*/
// core.numeric

var _ = require('./core.utils');
var cloneDeep = _.cloneDeep;
var array1d = _.array1d;
var array2d = _.array2d;
var check = _.check;
var isAssigned = check.assigned;
var listFromIterator = _.listFromIterator;

var numeric = require('numeric');
var ccsSparse = numeric.ccsSparse;
var ccsFull = numeric.ccsFull;
var ccsLUP = numeric.ccsLUP;
var ccsLUPSolve = numeric.ccsLUPSolve;

_.assign(exports, numeric);

function norm(x) {
  return Math.sqrt(numeric.sum(numeric.pow(x, 2)));
}
exports.norm = norm;

// A[i, :], 0-based
function nthRow(A, i) { return A[i]; }
exports.nthRow = nthRow;

// A[:, i], 0-based
function nthColumn(A, i) {
  return A.map(function(x) { return [x[i]]; });
}
exports.nthColumn = nthColumn;

/**
 * Return a sub matrix with selected indices.
 * @param {Matrix} A - master matrix
 * @param {Array|String} rows - 0-based row indices
 * @param {Array|String} cols - 0-based column indices
 * @returns {Matrix} - sub matrix
 */
function matSelect(A, rows, cols) {
  // check A, rows, cols
  var sTmp = size(A), mA = sTmp[0], nA = sTmp[1];
  if (rows === ':') rows = array1d(mA, function(i) { return i; });
  if (cols === ':') cols = array1d(nA, function(i) { return i; });
  var m = rows.length, n = cols.length;

  var out = array2d(m, n, 0);
  rows.forEach(function(row, i) {
    cols.forEach(function(col, j) {
      out[i][j] = A[row][col];
    });
  });
  return out;
}
exports.matSelect = matSelect;

function matUpdate_(A, rows, cols, val) {
  // check A, rows, cols
  var sTmp = size(A), mA = sTmp[0], nA = sTmp[1];
  if (rows === ':') rows = array1d(mA, function(i) { return i; });
  if (cols === ':') cols = array1d(nA, function(i) { return i; });
  var m = rows.length, n = cols.length;

  if (typeof val === 'number')
    val = array2d(m, n, val);

  var out = A;
  rows.forEach(function(row, i) {
    cols.forEach(function(col, j) {
      out[row][col] = val[i][j];
    });
  });
  return out;
}
exports.matUpdate_ = matUpdate_;

function matUpdate(A, rows, cols, val) {
  var copy = cloneDeep(A);
  return matUpdate_(copy, rows, cols, val);
}

exports.matUpdate = matUpdate;

function colon(from, to, step) {
  if (typeof step !== 'number') step = 1;
  var out = [], val = from;
  if (step > 0) {
    while (val <= to) {
      out.push(val);
      val = val + step;
    }
  } else if (step < 0) {
    while (val >= to) {
      out.push(val);
      val = val + step;
    }
  } else
    throw new Error('colon(): step must not equals to 0.');
  return out;
}

exports.colon = colon;

// pre: mat is a matrix;
function size(mat, dim) {
  if (dim === 1)
    return mat.length;
  else if (dim === 2)
    return mat[0].length;
  else
    return [mat.length, mat[0].length];
}
exports.size = size;

function vecEquals(a, b, aTolerance) {
  if (!_.isArray(a) || !_.isArray(b)) return false;
  if (a.length !== b.length) return false;
  if (a.length === 0) return false;

  var i, len = a.length;
  for (i = 0; i < len; ++i)
    if (typeof a[i] !== 'number') return false;

  for (i = 0; i < len; ++i)
    if (typeof b[i] !== 'number') return false;

  var tolerance = aTolerance || vecEquals.TOLERANCE;
  var d = numeric.sub(a, b);

  var absError = numeric.norm2(d);
  if (absError === 0) return true;

  var relativeError = absError / numeric.norm2(b);
  return relativeError < tolerance;
};
vecEquals.TOLERANCE = 1e-4;
exports.vecEquals = vecEquals;
exports.vecEql = vecEquals;
exports.array1dEquals = vecEquals;

// both a and b are 2d array
function array2dEquals(a, b, aTolerance) {
  if (a.length !== b.length) return false;

  var m = a.length;
  if (m === 0) return false;

  var n = a[0].length || 0;
  if (n === 0) return false;
  if (!(b && b[0] && b[0].length === n)) return false;

  var tolerance = typeof aTolerance === 'number' ? aTolerance : array2dEquals.TOLERANCE;
  var d = numeric.sub(a, b);

  var absError = numeric.norm2(d);
  if (absError === 0) return true;

  var relativeError = absError / numeric.norm2(b);
  return relativeError < tolerance;
}
array2dEquals.TOLERANCE = 1e-4;
exports.array2dEquals = array2dEquals;
exports.matrixEquals = array2dEquals;
exports.matEql = array2dEquals;

// input: ccs representation
// output: iterator that emits a sequence of (i, j, value) tuple.
function ccsValueListIterator(ccs) {
  // indices for first non-zero element in each column
  var nzIndices = ccs[0];
  var rowIndices = ccs[1];
  var values = ccs[2], len = values.length;
  var i = 0, currentColumn = 0;
  return {
    hasNext: function() {
      return i < len;
    },
    next: function() {
      var row, col, val, res;
      row = rowIndices[i];
      col = currentColumn;
      val = values[i];
      res = [ row, col, val ];

      // update:
      var indexAtNewColumn = nzIndices[currentColumn + 1];
      ++i;
      if (i >= indexAtNewColumn) {
        ++currentColumn;
      }

      return res;
    }
  };
}
exports.ccsValueListIterator = ccsValueListIterator;

// check whether a JS array is matrix like.
function isMatrixLikeArray(arr) {
  if (!_.isArray(arr)) return false;
  if (arr.length <= 0) return false;

  if (!_.isArray(arr[0])) return false;
  var m = arr.length, n = arr[0].length;
  if (n <= 0) return false;

  var i;
  for (i = 1; i < m; ++i)
    if (!_.isArray(arr[i]) || arr[i].length !== n) return false;

  return true;
}
exports.isMatrixLikeArray = isMatrixLikeArray;

// Prerequisites: mat is a matrix-like 2d JS array.
function matrixSize(mat) {
  return [mat.length, mat[0].length];
}

function DenseMatrix(m, n, fn) {
  if (typeof m === 'number' && m > 0 &&
      typeof n === 'number' && n > 0) {
    this._m = m;
    this._n = n;
    this._data = _.array2d(m, n, typeof fn !== 'undefined' ? fn : 0);
  } else if (isMatrixLikeArray(m)) {
    this._data = _.cloneDeep(m);

    var size = matrixSize(m);
    this._m = size[0];
    this._n = size[1];
  } else if (m instanceof DenseMatrix){
    this._m = m._m;
    this._n = m._n;
    this._data = _.cloneDeep(m._data);
  } else {
    throw new Error('DenseMatrix(m, n): m and n must be positive integer.');
  }
}

DenseMatrix.prototype.at = function(i, j) {
  if (i >= 0 && i < this._m && j >= 0 && j < this._n) {
    return this._data[i][j];
  }
  throw new Error('DenseMatrix::at(): index ' + [i, j] + ' outof bound ' + [this.m, this.n]);
};

DenseMatrix.prototype.size = function() {
  return [this._m, this._n];
};

DenseMatrix.prototype.m = function() { return this._m; };
DenseMatrix.prototype.n = function() { return this._n; };

DenseMatrix.prototype.set_ = function(i, j, val) {
  if (i < 0 || i >= this._m || j < 0 || j >= this._n)
    throw new Error('DenseMatrix::set(): index ' + [i, j] + ' outof bound ' + [this.m, this.n]);

  if (typeof val !== 'number')
    throw new Error('DenseMatrix::set_(i, j, val): val must be a number.');

  this._data[i][j] = val;
};

DenseMatrix.prototype.toFull = function() {
  return _.cloneDeep(this._data);
};

DenseMatrix.prototype.toCcs = function() {
  return ccsSparse(this._data);
};

exports.DenseMatrix = DenseMatrix;

function ensureMatrixDimension(mat, m, n) {
  var dmat = new DenseMatrix(mat);
  if (m !== null && dmat.m() !== m)
    throw new Error('ensureMatrixDimension(mat, m, n): mat.m = ' +
                    dmat.m() + ' but expect m = ' + m);

  if (n !== null && dmat.n() !== n)
    throw new Error('ensureMatrixDimension(mat, m, n): mat.n = ' +
                    dmat.n() + ' but expect n = ' + n);

  return mat;
}
// could be turned off by set numeric.ensureMatrixDimension = function(x) { return x; }
exports.ensureMatrixDimension = ensureMatrixDimension;

function DokSparseMatrix(valueList, m, n) {
  if ((m | 0) !== m || m <= 0 || (n | 0) !== n || n <= 0)
    throw new Error('DokSparseMatrix(ijvLst, m, n): m, n must be ' +
                   'positive integer.');

  this._m = m;
  this._n = n;
  this._dict = {};

  var iter = _.noopIterator;
  if (_.isArray(valueList)) {
    iter = _.iteratorFromList(valueList);
  } else if (_.isIterator(valueList)) {
    iter = valueList;
  }

  var ijv, i, j, val;
  while (iter.hasNext()) {
    ijv = iter.next();
    i = ijv[0];
    j = ijv[1];
    val = ijv[2];
    this.set_(i, j, val);
  }
}

DokSparseMatrix.prototype.size = function() { return [this.m, this.n]; };

DokSparseMatrix.prototype.m = function() { return this._m; };
DokSparseMatrix.prototype.n = function() { return this._n; };

DokSparseMatrix.prototype.at = function(i, j) {
  if (i >= 0 && i < this._m && j >= 0 && j < this._n) {
    if (this._dict[j] && this._dict[j][i]) {
      return this._dict[j][i];
    }
    return 0.0;
  }
  throw new Error('DokSparseMatrix::at(i, j): i,j: ' + [i, j] + ' outof dimension m, n: ' + [this._m, this._n]);
};

DokSparseMatrix.prototype.set_ = function(i, j, val) {
  if (i >= 0 && i < this._m && j >= 0 && j < this._n) {
    if (typeof val !== 'number')
      throw new Error('DokSparseMatrix::set_(i, j, val): val must be a number. val = ' + val);

    // Internally the dict is store the column index as first layer, then row index.
    // This make convertion to ccs efficient.
    if (!this._dict[j]) this._dict[j] = {};
    this._dict[j][i] = val;
    return;
  }
  throw new Error('DokSparseMatrix::set_(i, j, val): i,j: ' + [i, j] + ' outof dimension m, n: ' + [this._m, this._n]);
};

DokSparseMatrix.prototype.toFull = function() {
  var m = this._m, n = this._n, out = array2d(m, n, 0.0);
  Object.keys(this._dict).forEach(function(j) {
    Object.keys(this._dict[j]).forEach(function(i) {
      out[i][j] = this.at(i, j);
    }, this);
  }, this);

  return out;
};

DokSparseMatrix.prototype.toCcs = function() {
  var dict = this._dict, m = this._m, n = this._n;
  var ccs = [ [0], [], [] ];
  var nzCountInColumns = array1d(n, function(i) {
    if (typeof dict[i] !== 'undefined')
      return Object.keys(dict[i]).length;
    return 0;
  });

  nzCountInColumns.forEach(function(count) {
    var indices = ccs[0], sofar = indices[indices.length - 1];
    indices.push(sofar + count);
  });

  var cols = Object.keys(dict).sort(function(a, b) {
    return parseInt(a) - parseInt(b);
  });

  cols.forEach(function(col) {
    Object.keys(dict[col]).forEach(function(row) {
      var val = dict[col][row];
      ccs[1].push(row);
      ccs[2].push(val);
    });
  });

  return ccs;
};

DokSparseMatrix.prototype.toJSON = function() {
  return { m: this.m, n: this.n, values: this.toValueList() };
};

DokSparseMatrix.prototype.toValueList = function() {
  var values = [], dict = this._dict;
  Object.keys(dict).forEach(function(i) {
    Object.keys(dict[i]).forEach(function(j) {
      var val = dict[i][j];
      values.push([i, j, val]);
    });
  });
  return values;
};

// b is a [number]
// Return a [number]
DokSparseMatrix.prototype.solveVector = function(b) {
  if (this._m !== this._n) {
    throw new Error('DokSparseMatrix::solve can only be used by square matrix where this.m === this.n.');
  }

  if (this._m !== b.length) {
    throw new Error('DokSparseMatrix::solve can only be applied to vector of same dimension.');
  }

  var A = this.toCcs();
  var lup = ccsLUP(A);
  return ccsLUPSolve(lup, b);
};

// b is a SparseVector
// Return a SparseVector
DokSparseMatrix.prototype.solveSparseVector = function(b) {
  if (!(b instanceof SparseVector)) {
    throw new Error('DokSparseMatrix::solveSparseVector(b): b must be a SparseVector.');
  }

  if (this._m !== b.length()) {
    throw new Error('DokSparseMatrix::solve can only be applied to vector of same dimension.');
  }

  var A = this.toCcs();
  var lup = ccsLUP(A);
  var ccsB = b.toCcs();

  // TODO: make it fast..
  // var ccsX = ccsSparse(ccsFull(ccsLUPSolve(lup, ccsB)));
  var ccsX = ccsLUPSolve(lup, ccsB);

  var valueList = listFromIterator(ccsValueListIterator(ccsX)).map(function(tuple) {
    return [tuple[0], tuple[2]];
  });
  var res = new SparseVector(valueList, this._m);
  return res;
};

exports.DokSparseMatrix = DokSparseMatrix;

function SparseVector(valueList, dimension) {
  if ((dimension | 0) !== dimension || dimension <= 0)
    throw new Error('SparseVector(valueList, dimension): dimension must be positive integer.');

  this._dim = dimension;
  this._dict = {};

  var iter = _.noopIterator;
  if (_.isArray(valueList)) {
    iter = _.iteratorFromList(valueList);
  } else if (_.isIterator(valueList)) {
    iter = valueList;
  }

  var item, idx, val;
  while (iter.hasNext()) {
    item = iter.next();
    idx = item[0];
    val = item[1];
    if (val !== 0)
      this.set_(idx, val);
  }
}

SparseVector.prototype.length = function() { return this._dim; };
SparseVector.prototype.dim = SparseVector.prototype.length;

SparseVector.prototype.nzCount = function() {
  var count = 0, k;
  for (k in this._dict) ++count;
  return count;
};

SparseVector.prototype.at = function(i) {
  if (i >=0 && i < this._dim) {
    var val = this._dict[i];
    if (typeof val === 'number') return val;
    return 0;
  }
  throw new Error('SparseVector::at(i): index outof bound.');
};

SparseVector.prototype.valueListIterator = function() {
  var i = 0, indices = Object.keys(this._dict), len = indices.length;
  var dict = this._dict;
  indices.sort(function(a, b) {
    return parseInt(a) - parseInt(b);
  });

  return {
    hasNext: function() { return i < len; },
    next: function() {
      var idx = indices[i], item = [parseInt(idx), dict[idx]];
      ++i;
      return item;
    }
  };
};

SparseVector.prototype.equals = function(other, aTolerance) {
  // TODO: better implementation
  var a = this.toList();
  var b = typeof other.toList === 'function' ? other.toList() : other;
  var ok = vecEquals(a, b, aTolerance);
  return ok;
};

SparseVector.prototype.set_ = function(i, val) {
  if (i < 0 || i >= this._dim)
    throw new Error('SparseVector::set_(i): index outof bound.');

  if (typeof val !== 'number')
    throw new Error('SparseVector::set_(i, val): val must be a number. val = ' + val);

  if (val !== 0)
    this._dict[i] = val;
};


SparseVector.prototype.toCcs = function() {
  var dict = this._dict, dim = this._dim, key, i;
  var ccs = [ [0, -1], [], [] ];
  var nNonZeros = 0;
  for (key in dict) {
    i = parseInt(key);
    ccs[1].push(i);
    ccs[2].push(dict[i]);
    ++nNonZeros;
  }
  ccs[0][1] = nNonZeros;
  return ccs;
};

SparseVector.prototype.toFull = function() {
  var dim = this._dim, dict = this._dict;
  return array2d(dim, 1, function(i, j) {
    if (typeof dict[i] === 'number')
      return dict[i];
    return 0;
  });
};

SparseVector.prototype.toList = function() {
  var dim = this._dim, dict = this._dict;
  return array1d(dim, function(i) {
    if (typeof dict[i] === 'number')
      return dict[i];
    return 0;
  });
};

function mldivide(A, b) {
  if (A instanceof DokSparseMatrix && b instanceof SparseVector) {
    return A.solveSparseVector(b);
  } else if (A instanceof DokSparseMatrix && _.isArray(b)) {
    return A.solveVector(b);
  }

  throw new Error('mldivide(A, b): unsupported type A or b. A, b: ' + A + ', ' + b);
}
exports.mldivide = mldivide;

function eye(n) {
  return array2d(n, n, function(i, j) {
    if (i === j) return 1;
    return 0;
  });
}
exports.eye = eye;

exports.zeros = function zeros(m, n) {
  if (!isAssigned(n)) n = m;
  return array2d(m, n, 0);
};

exports.ones = function ones(m, n) {
  if (!isAssigned(n)) n = m;
  return array2d(m, n, 1);
};

exports.SparseVector = SparseVector;


exports.reshape = function reshape(mat, m, n) {
  var tmp = size(mat), oldM = tmp[0], oldN = tmp[1];

  if (oldM*oldN !== m*n)
    throw new Error('reshape(mat, m, n): can not reshape' +
                    'matrix of ' + oldM + ' by ' + oldN +
                    ' to ' + m + ' by ' + n);

  var oldI, oldJ, newI, newJ, k;
  var res = array2d(m, n, 0);
  for (oldI = 0; oldI < oldM; ++oldI) {
    for (oldJ = 0; oldJ < oldN; ++oldJ) {
      k = ij2kColumnOrder(oldI, oldJ, oldM, oldN);
      tmp = k2ijColumnOrder(k, m, n);
      newI = tmp[0], newJ = tmp[1];
      res[newI][newJ] = mat[oldI][oldJ];
    }
  }
  return res;
};

exports.ij2kColumnOrder = function ij2kColumnOrder(i, j, m, n) {
  return m*j + i;
};
var ij2kColumnOrder = exports.ij2kColumnOrder;

exports.k2ijColumnOrder = function k2ijColumnOrder(k, m, n) {
  var i = k%m, j = Math.floor(k/m);
  return [i, j];
};
var k2ijColumnOrder = exports.k2ijColumnOrder;

exports.ij2kRowOrder = function ij2kRowOrder(i, j, m, n) {
  return n*i + j;
};
var ij2kRowOrder = exports.ij2kRowOrder;

exports.k2ijRowOrder = function k2ijRowOrder(k, m, n) {
  var j = k%n, i = Math.floor(k/n);
  return [i, j];
};
var k2ijRowOrder = exports.k2ijRowOrder;
