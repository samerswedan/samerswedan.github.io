var board,
    game = new Chess();

var undo_move = function(){
    game.undo();
    game.undo();
    board.position(game.fen()); 
}

var redo_move = function(){
     
}


/*The "AI" part starts here */

var minimaxRoot =function(depth, game, isMaximisingPlayer) {

    var newGameMoves = game.ugly_moves();
    var bestMove = -9999;
    var bestMoveFound;

    for(var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i]
        game.ugly_move(newGameMove);
        var value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
        game.undo();
        if(value >= bestMove) {
            bestMove = value;
            bestMoveFound = newGameMove;
        }
    }
    return bestMoveFound;
};

var quiesenceRoot =function(depth, game, isMaximisingPlayer) {

    var newGameMoves = game.moves({verbose: true});
    var bestMove = -9999;
    var bestMoveFound;

    console.log(newGameMoves.length);
    
    for(var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        //console.log('Move flags');
        console.log("Quiesencent Move: ")
        console.log(newGameMove);
        if(String(newGameMove.flags).includes('e') || String(newGameMove.flags).includes('c')){
        //console.log('Capture move')
        //console.log(newGameMove);
        game.move(newGameMove);
        var value = quiesence(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
        game.undo();
        if(value >= bestMove) {
            bestMove = value;
            bestMoveFound = newGameMove;
        }
        }
    }
    return bestMoveFound;
};

var minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
    positionCount++;
    if (depth === 0) {
        return -evaluateBoard(game.board(), game);
    }

    var newGameMoves = game.ugly_moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
};

var quiesence = function (depth, game, alpha, beta, isMaximisingPlayer) {
    //console.log('started');
    positionCount++;
    if (depth === 0) {
        return -evaluateBoard(game.board());
    }

    var newGameMoves = game.moves({verbose: true});

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            //console.log('Move flags');
            //console.log(newGameMoves[i].flags);
        if(String(newGameMoves[i].flags).includes("e") || String(newGameMoves[i].flags).includes("c")){
            game.move(newGameMoves[i]);
            bestMove = Math.max(bestMove, quiesence(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            //console.log('Move flags');
            //console.log(newGameMoves[i].flags);
        if(String(newGameMoves[i].flags).includes("e") || String(newGameMoves[i].flags).includes("c")){
            game.move(newGameMoves[i]);
            bestMove = Math.min(bestMove, quiesence(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        }
        return bestMove;
    }
};

var evaluateBoard = function (board, game) {
    
    var mBias = ~~document.getElementById("pawnValue").value / 100;
    var oBias = ~~document.getElementById("knightValue").value / 100;
    
    return pieceValue(board) + pawnStructureValue(board) + mBias * generalMobilityValue(board) + threatValue(game) + oBias * offensiveStructureValue(board);
};

var threatValue = function (game) {

    var sgn = game.turn() == 'w' ? 1 : -1;

    if (game.in_check())
        return -sgn * 40;
    else if (game.in_checkmate())
        return -sgn * 5000;
    //else if (game.in_stalemate())
        //return -sgn * 300;

    return 0;
}

var pieceValue = function (board) {

    var totalPieceValue = 0;

    var getPieceValue = function (piece) {

        if (piece == null) {
            return 0;
        }

        var sgn = piece.color == 'w' ? 1 : -1;
        if (piece.type == 'p') {
            return sgn * 10;
        } else if (piece.type == 'r') {
            return sgn * 50;
        } else if (piece.type == 'n') {
            return sgn * 30;
        } else if (piece.type == 'b') {
            return sgn * 35;
        } else if (piece.type == 'q') {
            return sgn * 90;
        } else if (piece.type == 'k') {
            return sgn * 2000;
        }
        throw "Unknown piece type: " + piece.type;
    };

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalPieceValue += getPieceValue(board[j][i]);
        }
    }

    return totalPieceValue;
}

var offensiveStructureValue = function (board) {

    var totalOffensiveStructureScore = 0;

    var isProtectedByKnight = function (x, y, pieceColor) {
        
        var sgn = pieceColor == 'w' ? 1 : -1;
        
        var total = 0;

        if (x + 1 < 8 && y - 2 >= 0 && board[y - 2][x + 1] != null) {
            if (board[y - 2][x + 1].color == pieceColor && board[y - 2][x + 1].type == 'n')
                total += sgn * 5;
            if (board[y - 2][x + 1].color != pieceColor && board[y - 2][x + 1].type == 'n')
                total += -sgn * 5;
        }
        if (x - 1 >= 0 && y - 2 >= 0 && board[y - 2][x - 1] != null) {
            if (board[y - 2][x - 1].color == pieceColor && board[y - 2][x - 1].type == 'n')
                total += sgn * 5;
            if (board[y - 2][x - 1].color != pieceColor && board[y - 2][x - 1].type == 'n')
                total += -sgn * 5;
        }
        if (x + 1 < 8 && y + 2 < 8 && board[y + 2][x + 1] != null) {
            if (board[y + 2][x + 1].color == pieceColor && board[y + 2][x + 1].type == 'n')
                total += sgn * 5;
            if (board[y + 2][x + 1].color != pieceColor && board[y + 2][x + 1].type == 'n')
                total += -sgn * 5;
        }
        if (x - 1 >= 0 && y + 2 < 8 && board[y + 2][x - 1] != null) {
            if (board[y + 2][x - 1].color == pieceColor && board[y + 2][x - 1].type == 'n')
                total += sgn * 5;
            if (board[y + 2][x - 1].color != pieceColor && board[y + 2][x - 1].type == 'n')
                total += -sgn * 5;
        }
        if (x + 2 < 8 && y - 1 >= 0 && board[y - 1][x + 2] != null) {
            if (board[y - 1][x + 2].color == pieceColor && board[y - 1][x + 2].type == 'n')
                total += sgn * 5;
            if (board[y - 1][x + 2].color != pieceColor && board[y - 1][x + 2].type == 'n')
                total += -sgn * 5;
        }
        if (x - 2 >= 0 && y - 1 >= 0 && board[y - 1][x - 2] != null) {
            if (board[y - 1][x - 2].color == pieceColor && board[y - 1][x - 2].type == 'n')
                total += sgn * 5;
            if (board[y - 1][x - 2].color != pieceColor && board[y - 1][x - 2].type == 'n')
                total += -sgn * 5;
        }
        if (x + 2 < 8 && y + 1 < 8 && board[y + 1][x + 2] != null) {
            if (board[y + 1][x + 2].color == pieceColor && board[y + 1][x + 2].type == 'n')
                total += sgn * 5;
            if (board[y + 1][x + 2].color != pieceColor && board[y + 1][x + 2].type == 'n')
                total += -sgn * 5;
        }
        if (x - 2 >= 0 && y + 1 < 8 && board[y + 1][x - 2] != null) {
            if (board[y + 1][x - 2].color == pieceColor && board[y + 1][x - 2].type == 'n')
                total += sgn * 5;
            if (board[y + 1][x - 2].color != pieceColor && board[y + 1][x - 2].type == 'n')
                total += -sgn * 5;
        }

        return total;
    }

    var isProtectedByBishop = function (x, y, pieceColor) {
        
        var sgn = pieceColor == 'w' ? 1 : -1;
        
        var total = 0;

        // Diag Right & Down

        for (var i = x + 1; i < 8; i++) {
            if (y + i - x > 7)
                break;
            if (board[y + i - x][i] != null) {
                if (board[y + i - x][i].color == pieceColor && board[y + i - x][i].type == 'b')
                    total += sgn * 5;
                else if (board[y + i - x][i].color != pieceColor && board[y + i - x][i].type == 'b')
                    total += -sgn * 5;
                break;
            }
        }

        // Diag Left & Up

        for (var i = x - 1; i >= 0; i--) {
            if (y + i - x < 0)
                break;
            if (board[y + i - x][i] != null) {
                if (board[y + i - x][i].color == pieceColor && board[y + i - x][i].type == 'b')
                    total += sgn * 5;
                else if (board[y + i - x][i].color != pieceColor && board[y + i - x][i].type == 'b')
                    total += -sgn * 5;
                break;
            }
        }

        // Diag Left & Down

        for (var i = x - 1; i >= 0; i--) {
            if (y - i + x > 7)
                break;
            if (board[y - i + x][i] != null) {
                if (board[y - i + x][i].color == pieceColor && board[y - i + x][i].type == 'b')
                    total += sgn * 5;
                else if (board[y - i + x][i].color != pieceColor && board[y - i + x][i].type == 'b')
                    total += -sgn * 5;
                break;
            }
        }

        // Diag Right & Up

        for (var i = x + 1; i < 8; i++) {
            if (y - i + x < 0)
                break;
            if (board[y - i + x][i] != null) {
                if (board[y - i + x][i].color == pieceColor && board[y - i + x][i].type == 'b')
                    total += sgn * 5;
                else if (board[y - i + x][i].color != pieceColor && board[y - i + x][i].type == 'b')
                    total += -sgn * 5;
                break;
            }
        }

        return total;
    }

    var isProtectedByRook = function (x, y, pieceColor) {
        
        var sgn = pieceColor == 'w' ? 1 : -1;
        
        var total = 0;

        // Horizontal Right

        for (var i = x + 1; i < 8; i++) {
            if (board[y][i] != null) {
                if (board[y][i].color == pieceColor && board[y][i].type == 'r')
                    total += sgn * 5;
                else if (board[y][i].color != pieceColor && board[y][i].type == 'r')
                    total += -sgn * 5;
                break;
            }
        }

        // Horizontal Left

        for (var i = x - 1; i >= 0; i--) {
            if (board[y][i] != null) {
                if (board[y][i].color == pieceColor && board[y][i].type == 'r')
                    total += sgn * 5;
                else if (board[y][i].color != pieceColor && board[y][i].type == 'r')
                    total += -sgn * 5;
                break;
            }
        }

        // Vertical Up

        for (var i = y - 1; i >= 0; i--) {
            if (board[i][x] != null) {
                if (board[i][x].color == pieceColor && board[i][x].type == 'r')
                    total += sgn * 5;
                else if (board[i][x].color != pieceColor && board[i][x].type == 'r')
                    total += -sgn * 5;
                break;
            }
        }

        // Vertical Down

        for (var i = y + 1; i < 8; i++) {
            if (board[i][x] != null) {
                if (board[i][x].color == pieceColor && board[i][x].type == 'r')
                    total += sgn * 5;
                else if (board[i][x].color != pieceColor && board[i][x].type == 'r')
                    total += -sgn * 5;
                break;
            }
        }

        return total;
    }

    var isProtectedByQueen = function (x, y, pieceColor) {
        
        var sgn = pieceColor == 'w' ? 1 : -1;
        
        var total = 0;

        // Diag Right & Down

        for (var i = x + 1; i < 8; i++) {
            if (y + i - x > 7)
                break;
            if (board[y + i - x][i] != null) {
                if (board[y + i - x][i].color == pieceColor && board[y + i - x][i].type == 'q')
                    total += sgn * 5;
                else if (board[y + i - x][i].color != pieceColor && board[y + i - x][i].type == 'q')
                    total += -sgn * 5;
                break;
            }
        }

        // Diag Left & Up

        for (var i = x - 1; i >= 0; i--) {
            if (y + i - x < 0)
                break;
            if (board[y + i - x][i] != null) {
                if (board[y + i - x][i].color == pieceColor && board[y + i - x][i].type == 'q')
                    total += sgn * 5;
                else if (board[y + i - x][i].color != pieceColor && board[y + i - x][i].type == 'q')
                    total += -sgn * 5;
                break;
            }
        }

        // Diag Left & Down

        for (var i = x - 1; i >= 0; i--) {
            if (y - i + x > 7)
                break;
            if (board[y - i + x][i] != null) {
                if (board[y - i + x][i].color == pieceColor && board[y - i + x][i].type == 'q')
                    total += sgn * 5;
                else if (board[y - i + x][i].color != pieceColor && board[y - i + x][i].type == 'q')
                    total += -sgn * 5;
                break;
            }
        }

        // Diag Right & Up

        for (var i = x + 1; i < 8; i++) {
            if (y - i + x < 0)
                break;
            if (board[y - i + x][i] != null) {
                if (board[y - i + x][i].color == pieceColor && board[y - i + x][i].type == 'q')
                    total += sgn * 5;
                else if (board[y - i + x][i].color != pieceColor && board[y - i + x][i].type == 'q')
                    total += -sgn * 5;
                break;
            }
        }
            
        // Horizontal Right

        for (var i = x + 1; i < 8; i++) {
            if (board[y][i] != null) {
                if (board[y][i].color == pieceColor && board[y][i].type == 'q')
                    total += sgn * 5;
                else if (board[y][i].color != pieceColor && board[y][i].type == 'q')
                    total += -sgn * 5;
                break;
            }
        }

        // Horizontal Left

        for (var i = x - 1; i >= 0; i--) {
            if (board[y][i] != null) {
                if (board[y][i].color == pieceColor && board[y][i].type == 'q')
                    total += sgn * 5;
                else if (board[y][i].color != pieceColor && board[y][i].type == 'q')
                    total += -sgn * 5;
                break;
            }
        }

        // Vertical Up

        for (var i = y - 1; i >= 0; i--) {
            if (board[i][x] != null) {
                if (board[i][x].color == pieceColor && board[i][x].type == 'q')
                    total += sgn * 5;
                else if (board[i][x].color != pieceColor && board[i][x].type == 'q')
                    total -= sgn * 5;
                break;
            }
        }

        // Vertical Down

        for (var i = y + 1; i < 8; i++) {
            if (board[i][x] != null) {
                if (board[i][x].color == pieceColor && board[i][x].type == 'q')
                    total += sgn * 5;
                else if (board[i][x].color != pieceColor && board[i][x].type == 'q')
                    total -= sgn * 5;
                break;
            }
        }

        return total;
    }

    var isProtectedByPawn = function (x, y, pieceColor) {
        
        var total = 0;

        if (y > 0 && y < 7) {

            var sgn = pieceColor == 'w' ? 1 : -1;

            var pieceBehindLeft = null;
            var pieceBehindRight = null;
            var pieceAheadLeft = null;
            var pieceAheadRight = null;

            if (x - 1 >= 0){
                pieceBehindLeft = board[y + sgn][x - 1];
                pieceAheadLeft = board[y - sgn][x - 1];
            }
            if (x + 1 < 8){
                pieceBehindRight = board[y + sgn][x + 1];
                pieceAheadRight = board[y - sgn][x + 1];
            }

            if (pieceBehindLeft != null) {
                if (pieceBehindLeft.type == 'p' && pieceBehindLeft.color == pieceColor)
                    total += sgn * 5;
            }
            if (pieceBehindRight != null) {
                if (pieceBehindRight.type == 'p' && pieceBehindRight.color == pieceColor)
                    total += sgn * 5;
            }
            if (pieceAheadLeft != null) {
                if (pieceAheadLeft.type == 'p' && pieceAheadLeft.color != pieceColor)
                    total -= sgn * 5;
            }
            if (pieceAheadRight != null) {
                if (pieceAheadRight.type == 'p' && pieceAheadRight.color != pieceColor)
                    total -= sgn * 5;
            }
        }

        return total;
    }

    var isProtectedByKing = function (x, y, pieceColor) {

        var sgn = pieceColor == 'w' ? 1 : -1;
        
        var total = 0;

        var pieceAheadLeft = null;
        var pieceAheadRight = null;
        var pieceBehindLeft = null;
        var pieceBehindRight = null;

        var pieceLeft = null;
        var pieceRight = null;
        var pieceBehind = null;
        var pieceAhead = null;

        if (x - 1 >= 0)
            pieceLeft = board[y][x - 1];
        if (x + 1 < 8)
            pieceRight = board[y][x + 1];
        if (y - sgn >= 0 && y - sgn < 8)
            pieceAhead = board[y - sgn][x];
        if (y + sgn < 8 && y + sgn >= 0)
            pieceBehind = board[y + sgn][x];

        if (x - 1 >= 0 && y - sgn >= 0 && y - sgn < 8)
            pieceAheadLeft = board[y - sgn][x - 1];
        if (x + 1 < 8 && y - sgn >= 0 && y - sgn < 8)
            pieceAheadRight = board[y - sgn][x + 1];
        if (x - 1 >= 0 && y + sgn < 8 && y + sgn >= 0)
            pieceBehindLeft = board[y + sgn][x - 1];
        if (x + 1 < 8 && y + sgn < 8 && y + sgn >= 0)
            pieceBehindRight = board[y + sgn][x + 1];

        if (pieceAheadLeft != null) {
            if (pieceAheadLeft.type == 'k' && pieceAheadLeft.color == pieceColor)
                total += sgn * 5;
            else if (pieceAheadLeft.type == 'k' && pieceAheadLeft.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceBehindLeft != null) {
            if (pieceBehindLeft.type == 'k' && pieceBehindLeft.color == pieceColor)
                total += sgn * 5;
            else if (pieceBehindLeft.type == 'k' && pieceBehindLeft.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceAheadRight != null) {
            if (pieceAheadRight.type == 'k' && pieceAheadRight.color == pieceColor)
                total += sgn * 5;
            else if (pieceAheadRight.type == 'k' && pieceAheadRight.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceBehindRight != null) {
            if (pieceBehindRight.type == 'k' && pieceBehindRight.color == pieceColor)
                total += sgn * 5;
            else if (pieceBehindRight.type == 'k' && pieceBehindRight.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceLeft != null) {
            if (pieceLeft.type == 'k' && pieceLeft.color == pieceColor)
                total += sgn * 5;
            else if (pieceLeft.type == 'k' && pieceLeft.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceRight != null) {
            if (pieceRight.type == 'k' && pieceRight.color == pieceColor)
                total += sgn * 5;
            else if (pieceRight.type == 'k' && pieceRight.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceBehind != null) {
            if (pieceBehind.type == 'k' && pieceBehind.color == pieceColor)
                total += sgn * 5;
            else if (pieceBehind.type == 'k' && pieceBehind.color != pieceColor)
                total -= sgn * 5;
        }
        if (pieceAhead != null) {
            if (pieceAhead.type == 'k' && pieceAhead.color == pieceColor)
                total += sgn * 5;
            else if (pieceAhead.type == 'k' && pieceAhead.color != pieceColor)
                total -= sgn * 5;
        }

        return total;
    }

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {

            if (board[j][i] != null) {
                if (board[j][i].type != 'k' && board[j][i].type != 'p') {
                    var pieceColor = board[j][i].color;
                    var sgn = pieceColor == 'w' ? 1 : -1;
                    totalOffensiveStructureScore += isProtectedByPawn(i, j, pieceColor) + isProtectedByKnight(i, j, pieceColor) + isProtectedByBishop(i, j, pieceColor) + isProtectedByRook(i, j, pieceColor) + isProtectedByQueen(i, j, pieceColor) + isProtectedByKing(i, j, pieceColor);
                }
                /*else if (board[j][i].type == 'p') {
                    var pieceColor = board[j][i].color;
                    var sgn = pieceColor == 'w' ? 1 : -1;
                    totalOffensiveStructureScore += sgn * (isProtectedByKnight(i, j, pieceColor) ? 1 : 0 + isProtectedByBishop(i, j, pieceColor) ? 1 : 0 + isProtectedByRook(i, j, pieceColor) ? 1 : 0 + isProtectedByQueen(i, j, pieceColor) ? 1 : 0 + isProtectedByKing(i, j, pieceColor) ? 1 : 0);
                }*/
            }
        }
    }

    return totalOffensiveStructureScore;
}

var pawnStructureValue = function (board) {

    var totalStructureScore = 0;

    var pawnIsDoubled = function (x, y, pieceColor){

        if (y > 0 && y < 7) {

            var sgn = pieceColor == 'w' ? 1 : -1;

            var pieceAhead = board[y - sgn][x];
            var pieceBehind = board[y + sgn][x];

            if (pieceAhead == null && pieceBehind == null)
                return false;
            if (pieceAhead != null) {
                if (pieceAhead.type == 'p' && pieceAhead.color == pieceColor)
                    return true;
            }
            if (pieceBehind != null) {
                if (pieceBehind.type == 'p' && pieceBehind.color == pieceColor)
                    return true;
            }

            return false;
        }

        return false;
    }

    var pawnIsPassed = function(x, y, pieceColor){

        if (y > 0 && y < 7) {

            var sgn = pieceColor == 'w' ? 1 : -1;

            if (sgn < 0) {
               
                for (var i = y + 1; i < 7; i++) {

                    var pieceLeft = null;
                    var pieceRight = null;
                    var pieceAhead = board[i][x];

                    if (x - 1 >= 0)
                        pieceLeft = board[i][x - 1];
                    if (x + 1 < 8)
                        pieceRight = board[i][x + 1];

                    if (pieceLeft != null) {
                        if (pieceLeft.type == 'p' && pieceLeft.color != pieceColor)
                            return false;
                    }
                    if (pieceRight != null) {
                        if (pieceRight.type == 'p' && pieceRight.color != pieceColor)
                            return false;
                    }
                    if (pieceAhead != null) {
                        if (pieceAhead.type == 'p')
                            return false;
                    }
                }
            }
            else {
                for (var i = y - 1; i > 0; i--) {

                    var pieceLeft = null;
                    var pieceRight = null;

                    if (x - 1 >= 0)
                        pieceLeft = board[i][x - 1];
                    if (x + 1 < 8)
                        pieceRight = board[i][x + 1];

                    if (pieceLeft != null) {
                        if (pieceLeft.type == 'p' && pieceLeft.color != pieceColor)
                            return false;
                    }
                    if (pieceRight != null) {
                        if (pieceRight.type == 'p' && pieceRight.color != pieceColor)
                            return false;
                    }
                }
            }
        }

        return true;
    }

    var pawnIsProtected = function (x, y, pieceColor) {

        if (y > 0 && y < 7) {

            var sgn = pieceColor == 'w' ? 1 : -1;

            var pieceBehindLeft = null;
            var pieceBehindRight = null;

            if (x - 1 >= 0)
                pieceBehindLeft = board[y + sgn][x - 1];
            if (x + 1 < 8)
                pieceBehindRight = board[y + sgn][x + 1];

            if (pieceBehindLeft == null && pieceBehindRight == null)
                return false;
            if (pieceBehindLeft != null) {
                if (pieceBehindLeft.type == 'p' && pieceBehindLeft.color == pieceColor)
                    return true;
            }
            if (pieceBehindRight != null) {
                if (pieceBehindRight.type == 'p' && pieceBehindRight.color == pieceColor)
                    return true;
            }
        }

        return false;
    }

    var evaluatePawnPosition = function(piece, x, y){

        var totalScore = 0;

        if (piece == null || piece.type != 'p')
            return 0;

        var pieceColor = piece.color;
        var sgn = pieceColor == 'w' ? 1 : -1;

        if (pawnIsDoubled(x, y, pieceColor))
            totalScore -= sgn * 3;
        if (pawnIsPassed(x, y, pieceColor))
            totalScore += sgn * 10;
        if (pawnIsProtected(x, y, pieceColor))
            totalScore += sgn * 3 * 0;

        return totalScore;
    }

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalStructureScore += evaluatePawnPosition(board[j][i], i, j);
        }
    }

    return totalStructureScore;
}

var generalMobilityValue = function (board) {

    var totalGeneralMobilityScore = 0;

    var knightMobility = function (x, y, pieceColor) {
        var n = 0;
        var sgn = pieceColor == 'w' ? 1 : -1;

        if (x + 1 < 8 && y - 2 >= 0) {
            if (board[y - 2][x + 1] == null) {
                n++;
                //console.log("M1N");
            }
            else if (board[y - 2][x + 1].color != pieceColor) {
                n++;
                //console.log("M1");
            }
        }
        if (x - 1 >= 0 && y - 2 >= 0) {
            if (board[y - 2][x - 1] == null) {
                n++;
                //console.log("M2N");
            }
            else if (board[y - 2][x - 1].color != pieceColor) {
                n++;
                //console.log("M2");
            }
        }
        if (x + 1 < 8 && y + 2 < 8) {
            if (board[y + 2][x + 1] == null) {
                n++;
                //console.log("M3N");
            }
            else if (board[y + 2][x + 1].color != pieceColor) {
                n++;
                //console.log("M3");
            }
        }
        if (x - 1 >= 0 && y + 2 < 8) {
            if (board[y + 2][x - 1] == null) {
                n++;
                //console.log("M4N");
            }
            else if (board[y + 2][x - 1].color != pieceColor) {
                n++;
                //console.log("M4");
            }
        }
        if (x + 2 < 8 && y - 1 >= 0) {
            if (board[y - 1][x + 2] == null) {
                n++;
                //console.log("M5N");
            }
            else if (board[y - 1][x + 2].color != pieceColor) {
                n++;
                //console.log("M5");
            }
        }
        if (x - 2 >= 0 && y - 1 >= 0) {
            if (board[y - 1][x - 2] == null) {
                n++;
                //console.log("M6N");
            }
            else if (board[y - 1][x - 2].color != pieceColor) {
                n++;
                //console.log("M6");
            }
        }
        if (x + 2 < 8 && y + 1 < 8) {
            if (board[y + 1][x + 2] == null) {
                n++;
                //console.log("M7N");
            }
            else if (board[y + 1][x + 2].color != pieceColor) {
                n++;
                //console.log("M7");
            }
        }
        if (x - 2 >= 0 && y + 1 < 8) {
            if (board[y + 1][x - 2] == null) {
                n++;
                //console.log("M8N");
            }
            else if (board[y + 1][x - 2].color != pieceColor) {
                n++;
                //console.log("M8");
            }
        }

        //console.log("n: " + n);
        //console.log("color: " + pieceColor);

        return sgn * n / 2;
    }

    var bishopMobility = function (x, y, pieceColor) {

        var n = 0;
        var sgn = pieceColor == 'w' ? 1 : -1;

        // Diag Right & Down

        for (var i = x + 1; i < 8; i++) {
            if (y + i - x > 7)
                break;
            if (board[y + i - x][i] != null) {
                if (board[y + i - x][i].color == pieceColor)
                    break;
                else if (board[y + i - x][i].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        // Diag Left & Up

        for (var i = x - 1; i >= 0; i--) {
            if (y + i - x < 0)
                break;
            if (board[y + i - x][i] != null) {
                if (board[y + i - x][i].color == pieceColor)
                    break;
                else if (board[y + i - x][i].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        // Diag Left & Down

        for (var i = x - 1; i >= 0; i--) {
            if (y - i + x > 7)
                break;
            if (board[y - i + x][i] != null) {
                if (board[y - i + x][i].color == pieceColor)
                    break;
                else if (board[y - i + x][i].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        // Diag Right & Up

        for (var i = x + 1; i < 8; i++) {
            if (y - i + x < 0)
                break;
            if (board[y - i + x][i] != null) {
                if (board[y - i + x][i].color == pieceColor)
                    break;
                else if (board[y - i + x][i].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        return sgn * n / 3;
    }

    var rookMobility = function (x, y, pieceColor) {

        var n = 0;
        var sgn = pieceColor == 'w' ? 1 : -1;

        // Horizontal Right

        for (var i = x + 1; i < 8; i++) {
            if (board[y][i] != null) {
                if (board[y][i].color == pieceColor)
                    break;
                else if (board[y][i].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        // Horizontal Left

        for (var i = x - 1; i >= 0; i--) {
            if (board[y][i] != null) {
                if (board[y][i].color == pieceColor)
                    break;
                else if (board[y][i].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        // Vertical Up

        for (var i = y - 1; i >= 0; i--) {
            if (board[i][x] != null) {
                if (board[i][x].color == pieceColor)
                    break;
                else if (board[i][x].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        // Vertical Down

        for (var i = y + 1; i < 8; i++) {
            if (board[i][x] != null) {
                if (board[i][x].color == pieceColor)
                    break;
                else if (board[i][x].color != pieceColor) {
                    n++;
                    break;
                }
            }
            n++;
        }

        return sgn * n / 3;
    }

    var queenMobilty = function (x, y, pieceColor) {
        return (rookMobility(x, y, pieceColor) + bishopMobility(x, y, pieceColor)) / 2;
    }

    var pieceMobilityValue = function (piece, x, y) {
        if (piece == null)
            return 0;

        var pieceType = piece.type;
        var pieceColor = piece.color;

        if (pieceType == 'n')
            return knightMobility(x, y, pieceColor);
        else if (pieceType == 'b')
            return bishopMobility(x, y, pieceColor);
        else if (pieceType == 'r')
           return rookMobility(x, y, pieceColor);
        else if (pieceType == 'q')
            return queenMobilty(x, y, pieceColor);
        else
            return 0;
    }

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalGeneralMobilityScore += pieceMobilityValue(board[j][i], i, j);
        }
    }

    return totalGeneralMobilityScore;
}


/* board visualization and games state handling */

var onDragStart = function (source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeBestMove = function () {
    var bestMove = getBestMove(game);
    console.log('Best Move Present');
    console.log(bestMove);
    game.ugly_move(bestMove);
    board.position(game.fen());
    renderMoveHistory(game.history());
    if (game.game_over()) {
        alert('Game over');
    }
};


var positionCount;
var getBestMove = function (game) {
    if (game.game_over()) {
        alert('Game over');
    }

    positionCount = 0;
    var depth = parseInt($('#search-depth').find(':selected').text());

    var d = new Date().getTime();
    var bestMove = minimaxRoot(depth, game, true);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = ( positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000 + 's');
    $('#positions-per-s').text(positionsPerS);
    return bestMove;
};

var renderMoveHistory = function (moves) {
    var historyElement = $('#move-history').empty();
    historyElement.empty();
    for (var i = 0; i < moves.length; i = i + 2) {
        
        historyElement.append('<span>' + "White (Player): " + createReadableMove(moves[i]) + '<br>' + (moves[i + 1] ? "Black (AI): " +  createReadableMove(moves[i+1]) : ' ') + '</span><br>');
        
        if (moves[i + 1] != undefined) {
            console.log("White (Player): " + createReadableMove(moves[i]));
            console.log("Black (AI): " + createReadableMove(moves[i+1]));
        }
    }
    historyElement.scrollTop(historyElement[0].scrollHeight);

};

var createReadableMove = function(move){
    var readable_move = "";
    switch(move[0]){
        case 'N':
            if(move[1] == 'x')
                readable_move += "Knight Capture at " + move.substr(2);
            else
                readable_move += "Knight to " + move.substr(1);
            break;
        case 'B':
            if(move[1] == 'x')
                readable_move += "Bishop Capture at " + move.substr(2);
            else
                readable_move += "Bishop to " + move.substr(1);
            break;
        case 'R':
            if(move[1] == 'x')
                readable_move += "Rook Capture at " + move.substr(2);
            else
                readable_move += "Rook to " + move.substr(1);
            break;
        case 'K':
            if(move[1] == 'x')
                readable_move += "King Capture at " + move.substr(2);
            else
                readable_move += "King to " + move.substr(1);
            break;
        case 'Q':
            if(move[1] == 'x')
                readable_move += "Queen Capture at " + move.substr(2);
            else
                readable_move += "Queen to " + move.substr(1);
            break;
        default:
            if(move[1] == 'x')
                readable_move += "Pawn Capture at " + move.substr(2) + " from column " + move.substr(0,1);
            else
                readable_move += "Pawn to " + move;
            break;
                
    }
    return readable_move;
}

var onDrop = function (source, target) {

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    removeGreySquares();
    if (move === null) {
        return 'snapback';
    }

    renderMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
};

var onSnapEnd = function () {
    board.position(game.fen());
};

var onMouseoverSquare = function(square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function(square, piece) {
    removeGreySquares();
};

var removeGreySquares = function() {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function(square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
    orientation: 'white'
};
board = ChessBoard('board', cfg);