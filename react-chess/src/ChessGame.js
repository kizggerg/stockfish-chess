// src/ChessGame.js
import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjsx';
import './ChessGame.css'; // Import the CSS file

const ChessGame = () => {
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [turn, setTurn] = useState('white');
  const [validMoves, setValidMoves] = useState([]);
  const [engine, setEngine] = useState(null); // Stockfish engine instance
  const [bestMove, setBestMove] = useState('');
  const [evalScore, setEvalScore] = useState(0); // Evaluation score in centipawns
  const [winProbability, setWinProbability] = useState({ white: 50, black: 50 }); // Win probability for each side
  const [gameStatus, setGameStatus] = useState('Game in Progress'); // Game status
  const [boardWidth, setBoardWidth] = useState(Math.min(window.innerWidth * 0.8, 400)); // Dynamic board width

  useEffect(() => {
    const stockfish = new Worker('./lib/stockfish.js'); // Adjusted path as per your setup
    setEngine(stockfish);

    // Set up Stockfish event listener
    stockfish.onmessage = (event) => {
      const message = event.data;
      console.log('Stockfish:', message);

      if (message === 'uciok') {
        stockfish.postMessage('position startpos');
        stockfish.postMessage('go depth 15');
      }

      if (message.startsWith('bestmove')) {
        const parts = message.split(' ');
        setBestMove(parts[1]);
      }

      if (message.includes('info depth') && message.includes('score cp')) {
        const scoreRegex = /score cp (-?\d+)/;
        const match = scoreRegex.exec(message);
        if (match) {
          let evalScore = parseInt(match[1], 10);
          if (turn === 'black') evalScore = -evalScore;
          setEvalScore(evalScore);

          const whiteWinProb = 1 / (1 + Math.pow(10, -evalScore / 400));
          const blackWinProb = 1 - whiteWinProb;
          setWinProbability({
            white: (whiteWinProb * 100).toFixed(1),
            black: (blackWinProb * 100).toFixed(1),
          });
        }
      }
    };

    stockfish.postMessage('uci');
    return () => stockfish.terminate(); // Clean up the worker on component unmount
  }, []);

  const handleResize = () => {
    setBoardWidth(Math.min(window.innerWidth * 0.8, 400)); // Adjust dynamically based on screen size
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMove = (move) => {
    const gameMove = chess.move(move);
    if (gameMove === null) return;

    setFen(chess.fen());
    setTurn(chess.turn() === 'w' ? 'white' : 'black');
    updateValidMoves(chess);
    checkGameStatus();

    if (engine && !chess.isGameOver()) {
      engine.postMessage(`position fen ${chess.fen()}`);
      engine.postMessage('go depth 15');
    }
  };

  const checkGameStatus = () => {
    if (chess.isCheckmate()) {
      setGameStatus(turn === 'white' ? 'Black Wins' : 'White Wins');
    } else if (chess.isStalemate() || chess.isDraw()) {
      setGameStatus('Draw');
    } else {
      setGameStatus('Game in Progress');
    }
  };

  const makeBestMove = () => {
    if (bestMove) {
      const sourceSquare = bestMove.slice(0, 2);
      const targetSquare = bestMove.slice(2, 4);
      const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
      const move = promotion
        ? { from: sourceSquare, to: targetSquare, promotion }
        : { from: sourceSquare, to: targetSquare };
      handleMove(move);
    }
  };

  const updateValidMoves = (chessInstance) => {
    const moves = chessInstance.moves({ verbose: true });
    const moveBoards = moves.map((move) => {
      chessInstance.move(move);
      const board = chessInstance.fen();
      chessInstance.undo();
      return { fen: board, move: `${move.from}${move.to}` }; // Use simple format for easy comparison
    });
    setValidMoves(moveBoards);
  };

  const handleClickOnMoveBoard = (newFen) => {
    const newChess = new Chess(newFen);
    setChess(newChess);
    setFen(newFen);
    setTurn(newChess.turn() === 'w' ? 'white' : 'black');
    updateValidMoves(newChess);

    if (engine && !chess.isGameOver()) {
      engine.postMessage(`position fen ${newFen}`);
      engine.postMessage('go depth 15');
    }

    checkGameStatus();
  };

  useEffect(() => {
    updateValidMoves(chess);
    checkGameStatus(); // Update status on component load
  }, [chess]);

  return (
    <div className="chess-game-container">
      <h1 className="title">StockFish Chess</h1>
      <div className="header-info">
        <h3>Game Status: {gameStatus}</h3>
        <h3>Current Turn: {turn}</h3>
      </div>
      <div className="chessboard-container">
        <Chessboard
          width={boardWidth} // Dynamic width based on screen size
          position={fen}
          onDrop={handleMove}
          draggable={true}
        />
        <div className="stockfish-info">
          <h3>
            Best Move: {gameStatus === 'Game in Progress' ? bestMove : 'No Moves to Make'}{' '}
            {gameStatus === 'Game in Progress' && bestMove && (
              <button className="make-move-btn" onClick={makeBestMove}>
                Make Move
              </button>
            )}
          </h3>
          <h3>Evaluation Score: {evalScore} (centipawns)</h3>
          <h3>
            Win Probability: White - {winProbability.white}%, Black - {winProbability.black}%
          </h3>
        </div>
      </div>
      <h3>All Valid Moves:</h3>
      <div className="valid-moves-container">
        {validMoves.map((item, index) => (
          <div
            key={index}
            className="move-board"
            onClick={() => handleClickOnMoveBoard(item.fen)}
          >
            {item.move === bestMove && (
              <span className="best-move-indicator">★</span>
            )}
            <h4>Move: {item.move}</h4>
            <Chessboard width={200} position={item.fen} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessGame;