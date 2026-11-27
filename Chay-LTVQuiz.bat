@echo off
setlocal
title LTVQuiz

pushd "%~dp0" || goto folder_error

where node.exe >nul 2>&1 || goto missing_node
where npm.cmd >nul 2>&1 || goto missing_node

if not exist "node_modules\.bin\vite.cmd" if not exist "packages\web\node_modules\.bin\vite.cmd" (
    echo Dang cai thu vien cho LTVQuiz...
    call npm.cmd ci || goto run_error
)

echo Dang khoi dong LTVQuiz...
call npm.cmd run dev --workspace @ltvquiz/web -- --open || goto run_error

popd
exit /b 0

:missing_node
echo Khong tim thay Node.js hoac npm. Hay cai Node.js roi chay lai file nay.
goto pause_error

:run_error
echo LTVQuiz gap loi. Xem thong bao o tren.
goto pause_error

:folder_error
echo Khong mo duoc thu muc LTVQuiz.
pause
exit /b 1

:pause_error
popd
pause
exit /b 1
