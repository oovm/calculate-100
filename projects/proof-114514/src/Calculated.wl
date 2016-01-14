(* ::Package:: *)

SetDirectory@NotebookDirectory[];


LeftTeeArrow[x_,y_]:=Inactive[Plus][Inactive[Minus][x],y];
AngleBracket[t_Integer,u_Integer]:=If[
	u==0,
	10t+u,
	10^IntegerLength[u]t+u
];
enumerate[digits_]:=Module[
	{n=Length[digits],u=2 Max[digits]+1,places,evaluate},
	evaluate[n_List,m_Integer]:=Append[n,m];
	evaluate[{n___,a_,b_},op_]:={n,op[a,b]};
	places=Select[
	Permutations[ConstantArray[u,n-1]~Join~ConstantArray[-u,n-1]],
	Min[Accumulate[#]]>=0&
	];
	Flatten[Function[{x},
	Block[
	{i=0,j=1},
	Fold[evaluate,{},Prepend[x,First[digits]]/. {u:>digits[[++j]],-u:>Slot[++i]}]
	]
	]/@places
	]
];
filterIntegers[expr_]:=Block[
	{value = Quiet@Check[Activate@expr,Infinity]},
	If[!IntegerQ@value,Return@Nothing];
	If[value<0,{-value,Inactive[Minus][expr]},{value,expr}]
]
filterJoin[expr_]:=Block[
	{count},
	If[Head[expr]==AngleBracket,Return@Nothing];
	count=Count[expr,_AngleBracket,Infinity];
	If[count>0,Nothing, expr]
]
findSimplest[list_List]:=Block[
	{exprs=Last@Transpose[list]},
	First@SortBy[exprs,LeafCount]
]


digits={1,1,4,5,1,4};
ops={Inactive@Plus,Inactive@Subtract,LeftTeeArrow,Inactive@Times,Inactive@Divide,AngleBracket};
patterns =Evaluate[First[enumerate[digits]]]&@@@Tuples[ops,Length@digits-1];
patterns =DeleteDuplicates[filterJoin/@patterns];
answers = findSimplest/@SortBy[GroupBy[filterIntegers/@patterns,First],First]


Export["cache.raw.json",answers,"ExpressionJSON"];


digits={1,1,Inactive[Factorial][4],5,1,4};
ops={Inactive@Plus,Inactive@Subtract,LeftTeeArrow,Inactive@Times,Inactive@Divide};
patterns =Evaluate[First[enumerate[digits]]]&@@@Tuples[ops,Length@digits-1];
patterns =DeleteDuplicates[filterJoin/@patterns];
answers = findSimplest/@SortBy[GroupBy[filterIntegers/@patterns,First],First];


digits = {1,1,4,10,1,4}

n=Length[digits]
u=2 Max[digits]+1//Activate
	evaluate[n_List,m_Integer]:=Append[n,m];
	evaluate[{n___,a_,b_},op_]:={n,op[a,b]};
	places=Select[
	Permutations[ConstantArray[u,n-1]~Join~ConstantArray[-u,n-1]],
	Min[Accumulate[#]]>=0&
	]
	Flatten[Function[{x},
	Block[
	{i=0,j=1},
	Fold[evaluate,{},Prepend[x,First[digits]]/. {u:>digits[[++j]],-u:>Slot[++i]}]
	]
	]/@places
	]


Log10[34.]


SortBy[NSolve[#,x],#[[-1]]]&/@Thread[1 + Tuples[{-1, 1}, 3] . x^Range[3]==0]//MatrixForm






PlotComplexPoints[x/.{ToRules@NRoots[Times @@ (1 + Tuples[{-1, 1}, 11][[1;;512]] . x^Range[11]), x]},600, 20, 20, 10, {0.1, 0.3, 0.9}]


With[{\[Gamma] = 0.12, \[Beta] = 1.},
     fLor = Compile[{{x, _Integer}, {y, _Integer}},
                    (\[Gamma]/(\[Gamma] + x^2 + y^2))^\[Beta], RuntimeAttributes -> {Listable}]];

PlotComplexPoints[list_, magnification_, paddingX_, paddingY_, brightness_, vec_] :=
    Module[{dimX, dimY, RePos, ImPos, lor, posf, sparse},
           posf = 1 + Round[magnification (# - Min[#])] &;
           RePos = paddingX + posf[Re[list]]; ImPos = paddingY + posf[Im[list]];
           dimX = paddingX + Max[RePos]; dimY = paddingY + Max[ImPos];
           With[{spopt = SystemOptions["SparseArrayOptions"]}, 
                Internal`WithLocalSettings[
                SetSystemOptions["SparseArrayOptions" -> {"TreatRepeatedEntries" -> 1}],
                Image[Outer[Times,
                            brightness Abs[InverseFourier[Fourier[
                            SparseArray[Thread[Transpose[{ImPos, RePos}] -> 
                                        ConstantArray[1, Length[list]]], {dimY, dimX}]]
                            Fourier[RotateRight[fLor[#[[All, All, 1]],
                                                     #[[All, All, 2]]] & @
                                    Outer[List, 
                                          Range[-Quotient[dimY, 2],
                                                Quotient[dimY - 1, 2]], 
                                          Range[-Quotient[dimX, 2], 
                                                Quotient[dimX - 1, 2]]],
                                          {Quotient[dimY, 2], Quotient[dimX, 2]}]],
                                    FourierParameters -> {-1, 1}]], 
                            Developer`ToPackedArray[N[vec]]], Magnification -> 1],
                SetSystemOptions[spopt]]]]
