// Castillo–Duarte–Leyton-Álvarez–Liendo, arXiv:2511.01772v1, §2.
// Columns of B, B₁, B₂, written as vectors. These live in the exponent
// lattice Z³, not in the six/eight ambient coordinates of the varieties.
export const H = [[1,0,0], [0,1,0], [0,0,1], [-2,-1,2], [1,-1,1], [2,-2,1]];
export const H1 = [[-1,1,0], [0,-1,1], [3,0,-1], [1,0,0], [-2,3,-1], [-2,-1,2], [2,2,-2], [2,-2,1]];
export const H2 = [[1,-2,1], [4,-1,-1], [2,-1,0], [-2,3,-1], [-1,-2,2], [-4,-3,4]];
export const U = [[1,4,2], [-2,-1,-1], [1,-1,0]];
export const HOLE = [0,-1,1];
export const FIRST_HOLE = [1,1,-1]; // absent from S_A, but 2·FIRST_HOLE = g₇
export const FIRST_BASIS = [0,3,5];
export const SECOND_BASIS = [0,4,6];
// Each pair [end, start] represents a generator difference; null means
// the generator itself. Indices refer to H and H₁ respectively.
export const FIRST_RECIPES = [[1,0], [4,0], [4,3], [0,null], [1,5], [3,null], [1,3], [5,null]];
export const SECOND_RECIPES = [[1,0], [2,0], [3,0], [4,null], [5,0], [5,6]];
export const subtract = (a,b) => a.map((x,i) => x-b[i]);
export const scale = (a,t) => a.map(x => x*t);
export const multiply = (M,v) => M.map(row => row.reduce((s,x,i) => s+x*v[i],0));
export const determinant = ([a,b,c]) =>
  a[0]*(b[1]*c[2]-b[2]*c[1]) - a[1]*(b[0]*c[2]-b[2]*c[0]) + a[2]*(b[0]*c[1]-b[1]*c[0]);
export function inverse(M) {
  const d=determinant(M);
  if (!d) throw new Error("Singular lattice map");
  return M.map((_,i) => M.map((__,j) => {
    const rows=M.filter((_,r) => r!==j).map(row => row.filter((_,c) => c!==i));
    return ((i+j)%2 ? -1 : 1)*(rows[0][0]*rows[1][1]-rows[0][1]*rows[1][0])/d;
  }));
}
export const U_INVERSE = inverse(U);
export function fromRecipe(gens,[end,start]) {
  return start===null ? [...gens[end]] : subtract(gens[end],gens[start]);
}
export function nashChartGenerators(gens,basis) {
  const A=basis.map(i=>gens[i]);
  if (!determinant(A)) throw new Error("The selected minor is zero");
  const candidates=A.map(v=>[...v]);
  gens.forEach((g,i) => {
    if (basis.includes(i)) return;
    A.forEach((h,j) => {
      const replaced=A.map((v,k)=>k===j?g:v);
      if (determinant(replaced)) candidates.push(subtract(g,h));
    });
  });
  return [...new Map(candidates.map(v=>[v.join(","),v])).values()];
}
