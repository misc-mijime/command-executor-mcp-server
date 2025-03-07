import { describe, expect, it, vi } from 'vitest';
import { WslExecutor } from './wsl-executor.js';

describe('WslExecutor', () => {
  it('should create a WSL executor with default distribution', () => {
    const executor = new WslExecutor();
    expect(executor.distribution).toBe('Ubuntu');
  });

  it('should create a WSL executor with specified distribution', () => {
    const executor = new WslExecutor('Debian');
    expect(executor.distribution).toBe('Debian');
  });

  it('should convert Windows path to WSL path', () => {
    const executor = new WslExecutor();
    const windowsPath = 'C:\\Users\\test\\src';
    const wslPath = executor.convertToWslPath(windowsPath);
    expect(wslPath).toBe('/mnt/c/Users/test/src');
  });

  it('should execute a command in WSL', async () => {
    const executor = new WslExecutor();
    const command = 'ls';
    const workingDirectory = 'C:\\Users\\test\\src';
    const wslPath = '/mnt/c/Users/test/src';
    const wslCommand = `wsl -d Ubuntu --cd "${wslPath}" ${command}`;

    vi.spyOn(executor, 'convertToWslPath').mockReturnValue(wslPath);
    const execAsyncMock = vi
      .spyOn(executor, 'execAsync')
      .mockResolvedValue({ stdout: 'output', stderr: '' });

    const result = await executor.execute(command, workingDirectory);

    expect(executor.convertToWslPath).toHaveBeenCalledWith(workingDirectory);
    expect(execAsyncMock).toHaveBeenCalledWith(wslCommand);
    expect(result).toEqual({ stdout: 'output', stderr: '' });
  });
});
